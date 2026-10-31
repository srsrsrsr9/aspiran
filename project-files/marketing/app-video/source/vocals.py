# Builds a synthetic guide vocal (eSpeak NG, generic voice) for one language, fitted bar by bar, and mixes it over beat.wav.
import json, sys, subprocess, wave, numpy as np, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from tts import say
lang=sys.argv[1]; L=json.load(open(f'langs/{lang}.json')); song=json.load(open('song.json'))
SR=44100; BAR=4*60/song['bpm']; os.makedirs('vox',exist_ok=True)
def load(p):
    with wave.open(p) as w: return np.frombuffer(w.readframes(w.getnframes()),'<i2').astype(float)/32768
beat=load('beat.wav').reshape(-1,2); voc=np.zeros(len(beat))
line_bars=[i for i,b in enumerate(song['bars']) if b['kind']=='line']
for n,(bi,line) in enumerate(zip(line_bars,L['lines'])):
    raw=f'vox/{lang}_{n}.wav'; fit=f'vox/{lang}_{n}_fit.wav'
    say(line[1],L['voice'],raw,rate=165,pitch=38)
    d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',raw]))
    target=BAR*0.9; f=max(0.8,min(2.0,d/target))
    subprocess.run(['ffmpeg','-v','error','-y','-i',raw,'-af',f'atempo={f:.4f},highpass=f=120,acompressor=threshold=0.1:ratio=4:attack=5:release=60,aresample={SR}','-ac','1',fit],check=True)
    v=load(fit); v=v/ (np.max(np.abs(v))+1e-9)*0.8
    if song['bars'][bi].get('hook'):   # doubled chorus: a slightly delayed, quieter copy
        dbl=np.concatenate([np.zeros(int(0.018*SR)),v])[:len(v)]*0.5; v=v+dbl
    i=int((bi*BAR+0.05)*SR); j=min(len(voc),i+len(v)); voc[i:j]+=v[:j-i]
# light slap echo
e=np.zeros_like(voc); k=int(BAR/8*SR); e[k:]=voc[:-k]*0.18; voc=voc+e
env=np.convolve(np.abs(voc),np.ones(2205)/2205,'same'); duck=1-0.45*np.clip(env/0.15,0,1)
mix=beat*duck[:,None]*0.8+np.stack([voc,voc],1)*0.75
mix=mix/np.max(np.abs(mix))*0.9
with wave.open(f'mix_{lang}.wav','wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
print(lang,'ok')
