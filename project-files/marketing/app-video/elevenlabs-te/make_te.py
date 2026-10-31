# Telugu vocals for "Akela Nahi" via ElevenLabs TTS (stock voice only, no cloning), fitted bar by bar over the beat.
# Key is read from the ELEVENLABS_API_KEY environment variable only; it is never written anywhere.
# Usage: python3 make_te.py [voice_id]
import json, os, sys, subprocess, wave, urllib.request, urllib.error, numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); SRC=os.path.join(HERE,'..','source'); OUT=HERE
KEY=os.environ.get('ELEVENLABS_API_KEY','proxy-injected'); API='https://api.elevenlabs.io'
def get(p):
    r=urllib.request.Request(API+p,headers={'xi-api-key':KEY}); return json.load(urllib.request.urlopen(r))
def tts(text,voice,model,out):
    body=json.dumps({'text':text,'model_id':model,'language_code':'te',
        'voice_settings':{'stability':0.5,'similarity_boost':0.75,'style':0.6}}).encode()
    r=urllib.request.Request(f'{API}/v1/text-to-speech/{voice}?output_format=mp3_44100_128',data=body,
        headers={'xi-api-key':KEY,'Content-Type':'application/json'})
    open(out,'wb').write(urllib.request.urlopen(r).read())
# newest TTS model that lists Telugu (prefers v4, then v3); keys without models_read fall back to probing
def probe(m):
    try: tts('నమస్కారం','TX3LPaxmHKxFdv7VOQHJ',m,os.devnull); return True
    except urllib.error.HTTPError: return False
try:
    models=[m for m in get('/v1/models') if m.get('can_do_text_to_speech') and any(l.get('language_id')=='te' for l in m.get('languages',[]))]
    rank=lambda m:(('v4' in m['model_id'])*2+('v3' in m['model_id']), m['model_id'])
    model=max(models,key=rank)['model_id'] if models else 'eleven_v3'
except urllib.error.HTTPError:
    model=next(m for m in ('eleven_v4','eleven_v3') if probe(m))
# prefer a non-cloned voice in the library labelled Telugu, else a stock premade voice
voices=get('/v2/voices?page_size=100')['voices']
te=[v for v in voices if (v.get('labels') or {}).get('language')=='te' and v['category'] in ('generated','premade')]
stock=[v for v in voices if v['category']=='premade']
voice=sys.argv[1] if len(sys.argv)>1 else (te[0]['voice_id'] if te else next((v['voice_id'] for v in stock if v['name'].split()[0] in('Liam','Will','Chris','Brian','Eric')),stock[0]['voice_id']))
vname=next((v['name'] for v in voices if v['voice_id']==voice),voice)
print('model',model,'| voice',vname)
L=json.load(open(f'{SRC}/langs/telugu.json')); song=json.load(open(f'{SRC}/song.json'))
SR=44100; BAR=4*60/song['bpm']; os.makedirs(f'{OUT}/vox',exist_ok=True)
def load(p):
    with wave.open(p) as w: return np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
beat=load(f'{SRC}/../akela-nahi-beat.wav').reshape(-1,2); voc=np.zeros(len(beat))
line_bars=[i for i,b in enumerate(song['bars']) if b['kind']=='line']
for n,(bi,line) in enumerate(zip(line_bars,L['lines'])):
    raw=f'{OUT}/vox/te_{n:02d}.mp3'; fit=f'{OUT}/vox/te_{n:02d}_fit.wav'
    if not os.path.exists(raw): tts(line[1],voice,model,raw)
    # trim silence, then stretch to ~90% of a bar
    subprocess.run(['ffmpeg','-v','error','-y','-i',raw,'-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',f'{OUT}/vox/t.wav'],check=True)
    d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'{OUT}/vox/t.wav']))
    f=max(0.75,min(2.0,d/(BAR*0.92)))
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'{OUT}/vox/t.wav','-af',f'atempo={f:.4f},highpass=f=100,acompressor=threshold=0.1:ratio=3:attack=5:release=80,aresample={SR}','-ac','1',fit],check=True)
    v=load(fit); v=v/(np.max(np.abs(v))+1e-9)*0.8
    if song['bars'][bi].get('hook'): v=v+np.concatenate([np.zeros(int(0.018*SR)),v])[:len(v)]*0.45
    i=int((bi*BAR+0.04)*SR); j=min(len(voc),i+len(v)); voc[i:j]+=v[:j-i]
    print(n,f'{d:.2f}s -> x{f:.2f}')
os.remove(f'{OUT}/vox/t.wav')
e=np.zeros_like(voc); k=int(BAR/8*SR); e[k:]=voc[:-k]*0.15; voc=voc+e
env=np.convolve(np.abs(voc),np.ones(2205)/2205,'same'); duck=1-0.4*np.clip(env/0.15,0,1)
mix=beat*duck[:,None]*0.75+np.stack([voc,voc],1)*0.8; mix=mix/np.max(np.abs(mix))*0.9
with wave.open(f'{OUT}/mix_te.wav','wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
# rebuild the caption video from frames rendered off the sung lyrics (frames_el.cjs), with the new audio
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',f'{OUT}/frames_telugu/list.ffconcat','-i',f'{OUT}/mix_te.wav','-map','0:v','-map','1:a','-vf','fps=30,format=yuv420p','-c:v','libx264','-crf','20','-c:a','aac','-b:a','192k','-shortest',f'{OUT}/akela-nahi-telugu-elevenlabs.mp4'],check=True)
json.dump({'model':model,'voice':vname,'voice_id':voice},open(f'{OUT}/meta.json','w'),indent=1)
print('done')
