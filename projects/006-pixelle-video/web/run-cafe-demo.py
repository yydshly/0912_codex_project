"""Real upstream frame composition with Codex-authored text and supplied generated images.
No model provider is impersonated. Upstream Edge TTS, HTML templates and FFmpeg run normally.
Run using the upstream virtual environment. Outputs also enter the real application's history.
"""
import asyncio
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

project = Path(__file__).resolve().parents[1]
repo = project / '.upstream/Pixelle-Video'
os.chdir(repo)
sys.path.insert(0, str(repo))
from pixelle_video.service import PixelleVideoCore
from pixelle_video.models.storyboard import Storyboard, StoryboardConfig, StoryboardFrame

async def main():
    core = PixelleVideoCore()
    await core.initialize()
    (repo / 'output/codex-cafe-demo/frames').mkdir(parents=True, exist_ok=True)
    config = StoryboardConfig(media_width=1536, media_height=1024, task_id='codex-cafe-demo', n_storyboard=3,
        frame_template='1920x1080/image_full.html', voice_id='zh-CN-XiaoxiaoNeural', tts_speed=1.0)
    captions = ['清晨的街角，一杯咖啡，给忙碌的生活留一点空白。',
                '阳光落在桌边，奶香和咖啡香，让每一口都慢下来。',
                '推开门，坐一会儿。今天，从这里开始。']
    names = ['cafe-exterior.png', 'cafe-interior.png', 'cafe-exterior.png']
    frames = [StoryboardFrame(index=i, narration=t, image_prompt=None, media_type='image',
        image_path=str(project / 'assets' / names[i])) for i,t in enumerate(captions)]
    storyboard = Storyboard(title='街角咖啡 · 给生活留一点空白', config=config, frames=frames)
    for frame in frames:
        await core.frame_processor(frame, storyboard, config, total_frames=len(frames))
    output = repo / 'output/codex-cafe-demo/final.mp4'
    core.video.concat_videos([f.video_segment_path for f in frames], str(output))
    storyboard.final_video_path = str(output)
    storyboard.total_duration = sum(f.duration for f in frames)
    storyboard.completed_at = datetime.now()
    await core.persistence.save_storyboard(config.task_id, storyboard)
    await core.persistence.save_task_metadata(config.task_id, {'created_at':storyboard.created_at,
        'completed_at':storyboard.completed_at,'status':'completed', 'input':{'text':'\n'.join(captions),
        'mode':'Codex 素材 + 原生合成', 'n_scenes':3,'tts_inference_mode':'local (Edge TTS)', 'tts_voice':'zh-CN-XiaoxiaoNeural'},
        'config':{'frame_template':config.frame_template, 'source':'Codex text and imagegen assets; native composition'},
        'result':{'title':storyboard.title, 'video_path':str(output),'duration':storyboard.total_duration,
                  'n_frames':len(frames),'file_size':output.stat().st_size}})
    shutil.copy2(output, project / 'assets/cafe-demo.mp4')
    shutil.copy2(frames[0].composed_image_path, project / 'assets/composed-frame.png')
    print(f'COMPLETE: {storyboard.total_duration:.2f}s; {output.stat().st_size} bytes')

asyncio.run(main())
