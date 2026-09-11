'use strict';
const capabilities = {
  interactive: {
    title: '把抽象概念变成可以操作的页面', kind: '官方截图 / 未实测',
    image: 'assets/official-solar-system.png', alt: '官方太阳系公转示例：速度、方向、视角控件与老师讲解区',
    description: '太阳系示例包含速度、方向与视角控件。学生通过操作观察变化，老师可以结合页面进行引导。',
    mechanism: '模型生成交互网页，平台在隔离页面中运行，并通过消息通信接收老师的操作指令。',
    boundary: '生成的代码与计算公式需另外验证。这张截图只展示界面，不提供可操作的太阳系实验。'
  },
  lecture: {
    title: '让课件跟着老师的讲解推进', kind: '官方动图 / 未实测',
    image: 'assets/official-slides.gif', alt: '官方课件讲解动图，呈现幻灯片和 AI 老师界面',
    description: '课程把幻灯片内容与讲解、重点提示组织起来。学习者可以按课堂节奏理解知识。',
    mechanism: '先生成页面内容与教学动作，播放器管理位置，动作引擎执行语音、白板和高亮。',
    boundary: '语音需要配置可用服务。动图是上游示例，不能用来估计任意课程的准确性、速度或生成成本。'
  },
  discussion: {
    title: '让老师和同学围绕问题接着讲', kind: '原创流程示意 / 依据默认源码',
    flow: [['01', '理解课堂上下文', '当前页面、已有对话与角色人设进入上下文。'], ['02', '导演选择发言者', '选择老师、助教、同学，或把话题交还给用户。'], ['03', '回答并执行动作', '角色输出文字与白板等指令，前端接续下一轮。']],
    description: '用户可以追问，多个角色从不同角度参与讨论。默认路径按轮次组织发言。',
    mechanism: 'LangGraph 导演调度角色，每次请求最多一轮导演与角色生成；前端串联多轮请求。',
    boundary: '这是程序流程展示，没有实时 AI 回答。多个角色可以共用同一个模型，不代表多份独立事实核验。'
  },
  quiz: {
    title: '用问题检查理解，再给出反馈', kind: '原创流程示意 / 依据评分源码',
    flow: [['01', '生成练习', '课程场景可包含单选、多选和简答题。'], ['02', '提交作答', '按题目类型进入相应的判断或模型评分流程。'], ['03', '查看结果', '显示结果和评语，作为学习反馈的输入。']],
    description: '测验穿插在课程中。简答题由模型结合题目、答案和评分提示给出分数与短评。',
    mechanism: '简答题接口请求模型输出结构化分数和评语，解析后交给页面展示。',
    boundary: '当前解析失败会回退到约半分和通用提示。正式考核需更可靠的评分与异常处理，本页不运行真实评分。'
  },
  pbl: {
    title: '带着角色和任务，完成一个项目', kind: '官方动图 / 未实测',
    image: 'assets/official-pbl.gif', alt: '官方项目式学习动图：项目任务与角色互动界面',
    description: '围绕项目情境分配角色、设置里程碑与交付物，让学习过程从听课延伸到实践。',
    mechanism: '结构化项目规划连接场景、对话、提交和评价模块。',
    boundary: '素材用于理解产品形态，录制版本不详。实际任务是否可完成、评价是否可靠仍需实测。'
  },
  workbench: {
    title: '通过对话，把课程继续改好', kind: '原创流程示意 / 需要可选配置',
    flow: [['01', '提出课程修改', '规划课程、上传材料，或要求修改页面内容。'], ['02', '调用课程工具', '读取、增删、重排、修改页面，生成所需媒体。'], ['03', '保存并继续', '数据库保存会话，支持恢复与追加指令。']],
    description: 'Pro 工作台提供对话式课程创作。可以从大纲推进到页面，再继续修改课程。',
    mechanism: '服务端 Agent 通过明确且经过校验的工具更新课程数据，运行器管理持久会话。',
    boundary: '需要数据库、服务端 Agent runtime 和前端工作台开关。这里展示的是工作流程，没有连接真实工作台。'
  }
};
const buttons = [...document.querySelectorAll('[data-capability]')];
const picture = document.getElementById('feature-image');
const flow = document.getElementById('feature-flow');
const motion = document.getElementById('motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let active = 'interactive';
let motionVisible = false;

function showFlow(cells) {
  flow.replaceChildren();
  for (const [number, title, detail] of cells) {
    const card = document.createElement('div');
    card.className = 'flow-cell';
    for (const [tag, value] of [['span', number], ['h4', title], ['p', detail]]) {
      const child = document.createElement(tag); child.textContent = value; card.append(child);
    }
    flow.append(card);
  }
  flow.hidden = false;
}
function updateImage(entry) {
  const animated = entry.image?.endsWith('.gif');
  motion.hidden = !animated;
  if (animated && !motionVisible) {
    picture.hidden = true; picture.removeAttribute('src');
    showFlow([['官方动图', '按需播放', '点击下方“播放官方动图”查看上游示例。']]);
    motion.textContent = '播放官方动图';
  } else if (entry.image) {
    flow.hidden = true; picture.src = entry.image; picture.alt = entry.alt; picture.hidden = false;
    motion.textContent = '收起动图';
  } else {
    picture.hidden = true; picture.removeAttribute('src'); showFlow(entry.flow);
  }
}
function selectCapability(key) {
  if (!Object.hasOwn(capabilities, key)) return;
  active = key;
  const entry = capabilities[key];
  motionVisible = !reducedMotion.matches;
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.capability === key));
  document.getElementById('feature-title').textContent = entry.title;
  document.getElementById('feature-kind').textContent = entry.kind;
  document.getElementById('feature-description').textContent = entry.description;
  document.getElementById('feature-mechanism').textContent = entry.mechanism;
  document.getElementById('feature-boundary').textContent = entry.boundary;
  document.getElementById('feature-source').href = key === 'quiz' ? 'docs/validation.html' : 'docs/architecture.html';
  updateImage(entry);
}
buttons.forEach(button => button.addEventListener('click', () => selectCapability(button.dataset.capability)));
motion.addEventListener('click', () => { motionVisible = !motionVisible; updateImage(capabilities[active]); });
picture.addEventListener('error', () => {
  picture.hidden = true;
  showFlow([['素材暂不可用', '继续阅读说明', '请查看下方实现解读，或进入完整研究中的原始素材链接。']]);
});
