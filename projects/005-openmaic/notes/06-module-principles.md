# 六个模块的底层原理：从模型输出到课堂运行

研究版本：OpenMAIC 1.0.1，固定提交 `d5be3933176247feebf4007f6e31e20b93871609`。本文逐项阅读该版本源码，分析的是上游实现；没有调用模型验证整条生成链路。文中的欧姆定律数据和 JSON 是解释机制的示例，不是本次上游模型输出。

![OpenMAIC 六模块底层原理全图：材料与大纲经过提示词生成内容和动作；逐项区分课件、白板、实验、对话、测验、PBL 的模型生成、程序执行和限制；下方为共用运行底座及失败处理](../assets/module-principles-map.png)

[打开原理图原图，放大阅读](../assets/module-principles-map.png)。本研究依据下文固定源码策划，使用 AI 辅助绘制并核对；是实现机制示意，不是产品运行截图。精确字段、分支与来源以下文为准。

**OpenMAIC 的核心是把模型输出转成有结构的课程内容、可执行的教学动作和可持续更新的学习状态。** 这条实现链路并不依赖六个分别训练的专用模型。这里讨论的底层是应用源码中的生成、解释和执行机制；模型内部的训练与推理由所接入的模型服务负责。

## 1. 先纠正分类：六种效果，并不是六种独立生成器

| 看到的效果 | 在源码中的主要位置 | 生成与执行的分工 |
| :--- | :--- | :--- |
| 课件 | `Scene.type = slide` | 模型生成页面元素；课件渲染器绘制 |
| 白板 | `wb_*` 教学动作及白板状态 | 模型给出文字、公式、坐标和操作；动作引擎修改白板 |
| 实验 | `Scene.type = interactive` | 模型生成 HTML / CSS / JavaScript；浏览器运行 |
| 对话 | 课堂导演、角色提示词、流式输出与客户端循环 | 决定谁说话、说什么、执行哪些动作 |
| 测验 | `Scene.type = quiz` | 模型生成题目；程序或模型分别评分 |
| 项目任务 | `Scene.type = pbl` | 模型规划项目与引导；任务与记录系统维护学习过程 |

因此，内容层的主要场景是四种：slide、quiz、interactive、pbl。白板和课堂讨论是连接场景的横向能力，不能当作两种独立课件模板。[场景组装源码][builder]

从上到下可以拆成五层：

```text
材料与需求：学什么、给谁学、有哪些文字和图片
    ↓
课程规划：大纲、场景类型、知识点、实验或题目要求
    ↓
内容生成：Slide 数据 / 题目数组 / 网页代码 / 项目结构
    ↓
动作生成：讲解、聚焦元素、画白板、控制实验、发起讨论
    ↓
课堂运行：渲染 + 动作执行 + 角色调度 + 学习状态
```

这不是所有任务必须串行的部署承诺。固定版本的一站式服务端生成入口确实逐场景生成内容，再生成动作；媒体和 TTS 有独立后续阶段。其他入口可以采用不同调度。[服务端生成流程][classroom]

## 2. 共用底座：材料怎样进入模型

### 2.1 解析材料，不等于训练模型

文档入口按 MIME 类型和配置选择解析器，得到文档产物。大纲生成接收需求、学生资料、文档文字、图片描述或图片输入，以及可选网页研究上下文。它们被填入系统提示词和用户提示词，作为当前调用的上下文。[文档入口][extract]、[大纲生成][outline]

在已核对的大纲构造函数里，材料文字按 `MAX_PDF_CONTENT_CHARS` 截取，常量为 50,000 字符；视觉图片上限常量为 20。这是这条函数路径的上下文预算，不是整个平台统一的文件大小上限，更不是“整份资料都被模型完整理解”的保证。[常量][constants]

这一实现足以说明：不能把它简单概括成“上传 → 向量库检索 → 问答”。这里明确存在把材料和图片直接组织进提示词的路径，也有可选研究上下文；本次没有证据证明其处理流程与闭源 NotebookLM 完全相同。

### 2.2 系统提示词实际在约束什么

系统提示词承担生成规格：输出字段、可用元素、布局要求、题型、角色行为、允许的动作。用户提示词携带这次课程的需求、材料和配置。模型根据这些条件返回文本；程序再把文本解析为 JSON 或网页。

生成包的模型接口 `AICallFn` 只要求“接收 system、user 和可选 images，返回字符串”。模型厂商与调用参数由宿主适配；应用统一调用层基于 AI SDK 的 `generateText` / `streamText`。因此，可替换模型并不需要重写每一种课堂界面，但新模型仍需满足输出协议。[接口定义][aicall]、[调用层][llm]

### 2.3 谁决定生成课件还是实验

大纲提示词要求模型输出场景列表，包括类型、标题、教学目的、知识点和顺序；实验还带控件类型与实验构想，测验带题型、难度等配置，PBL 带项目配置。随后由代码按类型路由到不同模板。

例如“给初学者讲欧姆定律，并观察电阻变化”可以被规划为“概念课件 → 实验 → 测验”。**这个教学安排首先是模型推断的结果，不是一个已验证的教学最优化算法。** 配置缺失时，代码还有降级路径，例如不完整的交互大纲可能改为课件。[大纲提示词][outlineprompt]、[路由与降级][outline]

## 3. 课件：生成的是可编辑页面数据

### 3.1 生成过程

课件模板要求模型输出背景和元素列表。每个元素包含类型、位置、宽高及内容；文本、图片、图形、图表、公式等有不同字段。模板还提供画布尺寸、边距、字体与文本长度建议，以及公式必须使用独立 LaTeX 元素等约束。[课件内容提示词][slideprompt]

这更接近“模型写一份页面排版说明”，而不是模型生成一张不可编辑的 PPT 截图。示意如下，省略了完整协议的其他字段：

```json
{
  "elements": [
    {"id":"formula","type":"latex","left":80,"top":150,"width":600,"height":100,"latex":"I=\\frac{U}{R}"},
    {"id":"example","type":"text","left":80,"top":300,"width":750,"height":80,"content":"<p>6 V / 300 Ω = 0.02 A</p>"}
  ]
}
```

### 3.2 模型返回后，还有一条确定性的处理链

固定版本的 `generateSlideContent` 会：

1. 解析 JSON，检查是否存在元素数组。
2. 用 DSL 的归一化函数补默认字段；剥离部分空值，无法归一化的元素会被丢弃。
3. 根据原始图片尺寸修正图片比例。
4. 用 KaTeX 把公式表达式转成可显示的 HTML。
5. 将图片 ID 映射到实际资源；生成中的媒体可保留占位引用。
6. 规范视频引用，为最终元素分配新 ID，再组装为课件场景。

这里特别值得注意：**动作生成发生在内容处理之后，收到的是最终元素 ID。** 后续“高亮某条公式”才能指向真实存在的元素，而不是模型第一轮临时写的名称。[生成与后处理][generator]、[场景组装][builder]

### 3.3 讲解为什么能和页面配合

第二次生成以处理好的元素清单、知识点及可选跨页上下文为输入，输出“动作与讲解交错”的数组。例如：

```json
[
  {"type":"action","name":"spotlight","params":{"elementId":"latex_x7"}},
  {"type":"text","content":"电压不变时，电阻越大，电流越小。"}
]
```

这是模型输出格式，尚不是持久化的最终 Action。解析器会把 `text` 转成 `speech`，把动作名和参数转成内部动作，并保持先后顺序。渲染器展示页面，播放器执行动作；不需要模型逐帧计算画面。[动作提示词][slideactions]、[动作解析][actionparser]

语音也是分层的：模型生成讲稿文本，TTS 服务负责合成声音，播放器负责播放和完成回调。自动翻页、高亮与语音的衔接来自动作执行逻辑，不是音频模型天然认识整个课堂。[媒体与 TTS][media]、[播放器][playback]

**主要限制：** 边距和字数很多属于提示词约束；字段合法并不证明排版不溢出，KaTeX 能排版也不证明公式正确。这里没有可据以宣称“课件知识与版式已自动全面验证”的结果。

## 4. 白板：模型产生绘图指令，程序操作元素

### 4.1 白板并不是每次生成一张图片

默认课堂路径提供 `wb_open`、`wb_draw_text`、`wb_draw_latex`、`wb_draw_shape`、`wb_draw_line`、`wb_draw_chart`、`wb_draw_table`、代码绘制与编辑，以及删除、清空、关闭等动作。模型看到动作说明、参数格式、白板坐标范围和已有内容摘要，再决定添加什么。[白板动作参考][wbprompt]、[角色提示词构造][promptbuilder]

以学生追问“能不能展开计算”为例，模型可以输出：

```json
[
  {"type":"action","name":"wb_open","params":{}},
  {"type":"action","name":"wb_draw_latex","params":{"elementId":"ohm-step-1","latex":"I=\\frac{6}{300}=0.02\\,A","x":80,"y":100,"width":700,"height":100}},
  {"type":"text","content":"这里得到的是安培，换成毫安需要乘以一千。"}
]
```

### 4.2 执行时发生什么

动作引擎根据 `type` 分派到具体函数。画公式时，程序调用 KaTeX，创建一个包含坐标、宽高、公式与 HTML 的元素，写入白板状态。白板组件通过元素渲染器展示它，并添加出现、消失等动画。未打开白板就收到绘制动作时，引擎可以自动打开。[动作引擎][engine]、[白板画布][wbcanvas]

因此，视觉上的“一步步推导”主要来自**多条元素操作＋顺序执行＋动画**。它不是从视频中学习老师的手部轨迹，也不能据此理解为符号计算器已经验证了每一步数学推理。

### 4.3 连续对话如何避免重复画

提示词构造会合入当前状态、已有白板内容和当轮尚未完全落到界面的动作账本，帮助后续角色知道“已经画了什么”。稳定元素 ID 支持删除或编辑指定内容。白板和课件画面还存在互斥关系：白板打开时，应先关闭它再对课件聚焦，否则高亮可能看不见。[上下文构造][promptbuilder]

**主要限制：** 模型仍可能选错坐标、遮挡内容或写错公式。该版本白板参考明确提示，没有专用函数绘图原语，不能把三角形或几条直线当作准确的抛物线。复杂曲线与学科模拟更适合交互网页或专门计算模块。

## 5. 实验：先让模型编程，再由浏览器计算

### 5.1 为什么它能做不同学科的实验

交互场景按 `widgetType` 选择专门模板：simulation、diagram、code、game、visualization3d；还有受条件控制的 procedural-skill 分支。模板要求模型生成完整网页，通常包含：

- HTML：按钮、滑杆、文字和画布容器。
- CSS：布局与样式。
- JavaScript：变量、计算、事件响应和动画。
- `widget-config`：变量名、范围、默认值、预设等配置。
- 消息监听器：接受老师改变状态、聚焦或注释的指令。

这里的“仿真”“3D”“小游戏”主要是不同的生成规范与网页实现方式，不意味着平台自带所有学科的专业计算引擎。[交互生成路由][generator]、[仿真模板][simulation]

### 5.2 以欧姆定律为例

模型可以编写下面这样的计算逻辑，随后它在浏览器中运行：

```javascript
// 机制示例，不是上游实际生成结果。
function update(voltage, resistance) {
  const current = voltage / resistance;
  const power = voltage * current;
  renderCircuitAndChart({ voltage, resistance, current, power });
}
```

生成阶段调用模型；实验使用阶段，学生拖动滑杆触发 `input` 事件，JavaScript 重新计算并重绘。**通常不需要每拖动一次就调用模型。** 这解释了为什么这种实验可以即时响应，也解释了为什么错误的公式会稳定地产生错误结果。

### 5.3 老师如何“操作实验”

内容生成结束后，程序从当前 HTML 提取可交互元素清单，供动作生成参考。老师输出的 `widget_setState` 被动作引擎转换为 `SET_WIDGET_STATE` 消息，通过 `postMessage` 发送到 iframe。生成页面中的监听器找到对应滑杆，更新数值并触发事件。

```text
老师生成状态动作，例如把 voltage 改成 12
  → 动作引擎发送 SET_WIDGET_STATE
  → iframe 中的监听器更新滑杆
  → 触发 input 事件
  → 本地计算与画面刷新
```

高亮、注释、揭示内容也走类似协议。这依赖生成页面遵守控件命名和消息协议；不是老师通过视觉直接拖动屏幕上的控件。[动作生成与元素提取][generator]、[iframe 宿主][iframe]、[动作引擎][engine]

### 5.4 隔离与修复的实际范围

生成后先提取 HTML，再做 LaTeX 分隔符处理与 KaTeX 资源补充。页面在带 sandbox 的 iframe 中运行；宿主允许脚本等能力，但不加 `allow-same-origin`，以限制它直接访问父页面的同源数据。宿主还接收来源匹配的运行错误消息。[后处理][postprocessor]、[iframe 宿主][iframe]

**这些处理不等于实验自动验证。** HTML 可提取、脚本可执行、iframe 有隔离，都不能证明数值正确、每个控件有效或 3D 模型符合真实规律。当前源码路径中，没有看到所有生成实验都经过物理引擎验证或自动浏览器修复闭环的保证。

## 6. 对话：导演选角色，角色生成文字与动作

### 6.1 “多智能体”究竟多在哪里

角色配置包含身份、姓名、人设、可用动作等。同一语言模型可以接收不同的角色提示词：老师讲解并控制教学；助教补充解释；学生简短提问。它们不是必须由三个分别训练的模型承担。

默认课堂导演使用 LangGraph 状态图，每次请求最多运行：

```text
START → director → agent_generate → END
                   或直接 END
```

多轮讨论是前端把多次请求串起来。导演可选择下一个角色、交给 USER 或结束；只有一个角色时使用代码分派，首轮指定触发角色也可跳过导演模型。因此，不能理解为后台每次都启动一群模型无界讨论。[导演实现][director]

### 6.2 角色生成时看到了哪些上下文

提示词包含角色人设、当前场景、可用动作说明、课堂状态、学生资料、讨论主题、其他角色的发言摘要及白板内容。当前场景和角色的动作权限共同限制可用动作。例如不能把课件专用聚焦动作随意用于实验场景。[提示词构造][promptbuilder]

这属于“把状态转成模型可读上下文”。并不能推断模型每轮都看到了整个网页截图、所有原始文件或全部历史；具体可见内容取决于上下文构造与摘要策略。

### 6.3 为什么能一边回答一边操作

默认课堂角色输出的是文字与动作交错的结构化 JSON 数组。流式解析器累计模型输出，用 JSON 修复与部分 JSON 解析处理尚未结束的数组；已完成的动作对象可以发出，末尾文字可以按增量发出。服务器通过 SSE 把事件传给前端，前端按顺序安排显示与动作。[流式解析器][streamparser]、[导演与流式事件][director]

**需要区分两种机制：** 默认课堂这里主要是“让模型按约定格式写动作，再由程序解析执行”；PBL 导师及部分工作台流程则真的传入 AI SDK 的工具定义，运行工具调用循环。不能把所有看起来像工具的动作都解释成同一种模型原生 function calling。

### 6.4 打断后为什么能继续上课

播放器维护 idle、playing、paused、live 等状态，以及场景和动作位置。用户插话时保存讲课位置并进入 live；讨论结束后恢复位置。白板、声音、聚焦等效果通过共用执行层出现，因此预生成讲解和临场回答能够衔接。[播放器状态机][playback]

**主要限制：** 导演选角色或解析失败可能结束当前轮；人设与动作权限不能保证回答正确。多角色也不天然构成独立事实核验，因为它们可能共享模型和上下文。

## 7. 测验：题目生成与评分是两个不同问题

### 7.1 题目如何生成

模型接收知识点、题数、难度和题型，返回题目数组。程序为题目补 ID，并把选项归一化为 value / label；选择题答案对齐到选项值。简答题明确走 `short_answer` 类型，生成器不把它处理成一个可精确匹配的选项答案。[题目生成][generator]

### 7.2 选择题如何判分

`gradeChoiceQuestions` 在本地运行，比较学生提交的选项值与答案值。多选题排序后做完整一致比较，正确得该题分值，否则得 0；它不是模型逐题理解学生意图。持久化答案有精确、唯一的兼容映射，学生提交则按 UI 生成的选项值直接比较。[选择题判分][grading]

所以，选择题主要风险在答案键是否正确。一个写错的标准答案，会被程序一致地执行，确定性并不等于正确性。

### 7.3 简答题如何评分

实际课堂 `QuizView` 把题目、学生答案、满分和可选评分要点送到 `/api/quiz-grade`。评分提示词要求模型返回 score 与 comment，程序解析、取整并限制在分值范围内。前端以达到满分 80% 作为该界面的“正确”标记阈值。[课堂测验页面][quizview]、[评分接口][quizapi]

有两个明确的失败回退：服务端无法解析模型输出时给约半分和通用评语；前端请求失败时也会给约半分并显示服务不可用提示。这个分数反映的是降级策略，不能当作学生能力证据。

此外，普通评分接口的输入并没有自动包含整份原始教材及可验证证据。不能把它称为已经实现“严格对照教材的可靠语义判卷”。

## 8. 项目任务：生成项目结构，再运行有状态的辅导流程

### 8.1 项目规划比生成一张任务卡复杂

PBL v2 首选一次模型调用生成项目结构，包括目标、收获、导师角色、里程碑、微任务与相关要求。随后检查结构、主题、语言等问题；若存在缺口，把具体问题反馈给模型，最多再做一次针对性修正，然后补运行字段并检查是否完整。[PBL 单次规划器][pblsingle]

若仍失败，宿主可以注入带工具调用的循环规划器，通过工具逐步建立项目信息、角色、里程碑和任务；该循环有步数上限。HTTP / 服务商错误或取消不会盲目进入同一服务的循环回退。这条固定版本路径没有必要再推断为“最终一定回退到旧版 PBL”。[回退分支][generator]、[工具规划器][pblloop]

### 8.2 上课时不再重新生成整个项目

项目启动后，导师读取当前里程碑、微任务、近期对话、提交物及学习状态。当前导师工具主要包括 `record_observation` 和 `adjust_difficulty`：记录观察、按学习者明确意图调整难度。它的主要职责是辅导当前任务；任务是否完成与推进由提交、评价及相应运行逻辑管理，不能凭聊天中一句“你完成了”就认定状态已改变。[导师实现][instructor]

### 8.3 评价为什么单独做

Evaluator 使用独立提示词，根据具体阶段生成任务评价、里程碑反思或最终成果总结。它输出可读反馈和结构化尾部数据，程序解析后保存评价记录。任务评价会关注最新提交，避免把早期错误草稿反复当作当前答案。[评价器][evaluator]、[提交记录][submission]

项目的定义、提交、评价和学习事件都有结构化记录；运行恢复代码可以从设计模板和运行记录重建学习状态。因此，PBL 的底层不仅是聊天历史，还包括持久化的任务过程。[运行状态恢复][pblfold]

情境角色扮演还有单独的 Simulator 路径，读取情境、角色和当前幕来生成角色回应。该版本相关推进逻辑还区分“角色继续互动”与“学习者点击结束这一幕”，不能把情境里的全部发言都当成普通课堂导演调度。[情境模拟器][simulator]

**主要限制：** 难度标签、观察事件和星级反馈不等于经过教育测量验证的掌握度模型。项目界面完整，也不证明交付物评价客观可靠。

## 9. 共同的运行机制：为什么内容与动作必须分开

同一页公式可以有短讲、长讲、追问补充、不同语言讲解。页面元素负责稳定的视觉结构，动作负责这一次如何讲。把它们拆开，才容易独立编辑、重放和插入临场回答。

动作引擎也区分完成时机：聚焦与激光效果可发出后继续；语音、视频和白板操作需要考虑完成回调或等待；讨论生命周期由外层播放器处理。顺序、暂停、取消和恢复是程序维护的，不是模型自己记住“现在正在播放第几秒”。[动作引擎][engine]、[播放器][playback]

结构修复分为不同层次，不能混为一种“自动纠错”：

| 层次 | 源码中的机制 | 不能保证的事情 |
| :--- | :--- | :--- |
| 文本解析 | JSON.parse、jsonrepair、partial-json 等 | 不能修正事实与推理 |
| 数据结构 | 默认值、类型与引用处理、场景组装 | 不能证明知识和布局正确 |
| 生成失败 | 部分入口重试、默认动作、跳过失败场景 | 不能保证课程无遗漏 |
| 网络失败 | 可重试错误分类、退避与取消支持 | 不能代替正确配置和可用服务 |
| 运行控制 | 动作队列、游标、事件与状态恢复 | 不能证明生成内容有效教学 |

通用重试器默认最多重试 5 次，采用带随机扰动的指数退避；这不是每个模型调用都必然执行 6 次。只有使用该包装器的路径及满足重试条件时才生效。一站式生成对内容返回 null 配置了重试，持续失败后可能跳过场景；动作解析失败则有默认讲解回退。[重试器][retry]、[服务端流程][classroom]、[默认动作][generator]

## 10. 对我们最有价值的研究结论

若要复用这些能力，应分别研究三个合同：

1. **生成合同：** 提供哪些上下文，要求返回哪些结构或代码，失败如何识别。
2. **执行合同：** 元素 ID、白板动作、iframe 消息和任务状态怎样对应真实操作。
3. **质量合同：** 哪些结果由规则验证，哪些只是模型判断，哪些仍需人工审核。

其中最适合做贯穿实验的是交互页面：固定欧姆定律材料，保存大纲、生成的 HTML、变量配置和教学动作，测试已知输入输出，再检查老师能否通过状态消息正确改变控件。课件可检查元素引用与溢出，白板可检查公式与坐标，对话可检查角色和动作权限，测验可检查评分边界，项目任务可检查提交与推进条件。

这些是后续验证建议，尚未执行完整模型实验。我们当前本地案例真实接入的是官方课件 renderer，其余本地规则与预设脚本不能当作上游生成结果。[案例实现边界](05-case-study.md)

## 固定源码入口

以下链接均指向本次固定提交；与该提交文件路径核对，不代表模型运行评估。

- [材料解析入口][extract]；[大纲生成][outline]；[大纲提示词][outlineprompt]；[上下文预算常量][constants]。
- [模型调用接口][aicall]；[统一模型调用层][llm]；[内容与动作生成][generator]；[场景组装][builder]。
- [课件内容提示词][slideprompt]；[课件动作提示词][slideactions]；[动作解析][actionparser]；[TTS 与媒体][media]。
- [白板动作参考][wbprompt]；[白板画布][wbcanvas]；[动作引擎][engine]；[播放器][playback]。
- [实验模板][simulation]；[HTML 后处理][postprocessor]；[iframe 宿主][iframe]。
- [导演状态图][director]；[角色上下文构造][promptbuilder]；[流式数组解析][streamparser]。
- [选择题评分][grading]；[实际课堂测验页面][quizview]；[简答题评分 API][quizapi]。
- [PBL 单次规划][pblsingle]；[工具循环规划][pblloop]；[导师][instructor]；[评价器][evaluator]；[提交][submission]；[状态重建][pblfold]；[情境角色][simulator]。
- [服务端一站式流程][classroom]；[重试工具][retry]。

[返回研究笔记](README.md) · [能力总览](../README.md)


[extract]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/document/extract.ts
[outline]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/outline-generator.ts
[outlineprompt]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/templates/requirements-to-outlines/user.md
[constants]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/constants.ts
[aicall]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/pipeline-types.ts
[llm]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/ai/llm.ts
[generator]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/scene-generator.ts
[builder]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/scene-builder.ts
[slideprompt]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/templates/slide-content/system.md
[slideactions]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/templates/slide-actions/system.md
[actionparser]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/action-parser.ts
[media]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/server/classroom-media-generation.ts
[wbprompt]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/prompts/snippets/whiteboard-reference.md
[wbcanvas]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/components/whiteboard/whiteboard-canvas.tsx
[engine]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/action/engine.ts
[playback]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/playback/engine.ts
[simulation]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/templates/simulation-content/system.md
[postprocessor]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/interactive-post-processor.ts
[iframe]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/components/scene-renderers/InteractiveIframeHost.tsx
[director]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/orchestration/director-graph.ts
[promptbuilder]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/orchestration/prompt-builder.ts
[streamparser]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/orchestration/stateless-generate.ts
[grading]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/quiz/grading.ts
[quizview]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/components/scene-renderers/quiz-view.tsx
[quizapi]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/app/api/quiz-grade/route.ts
[pblsingle]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/pbl/planner-single-call.ts
[pblloop]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/pbl/v2/agents/planner.ts
[instructor]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/pbl/v2/agents/instructor.ts
[evaluator]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/pbl/v2/agents/evaluator.ts
[submission]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/pbl/v2/operations/runtime/submission.ts
[pblfold]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/pbl/v2/runtime/fold.ts
[simulator]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/pbl/v2/agents/simulator.ts
[classroom]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/lib/server/classroom-generation.ts
[retry]: https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/packages/%40openmaic/generation/src/generation-retry.ts
