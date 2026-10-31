# Original lo-fi boom-bap beat, synthesised from scratch (no samples). 90 BPM, C# minor.
import numpy as np, wave
SR=44100; BPM=90; B=60/BPM; BAR=4*B; NB=17
N=int(NB*BAR*SR)+SR; mix=np.zeros(N); rng=np.random.default_rng(7)
def at(t): return int(t*SR)
def add(sig,t,g=1.0):
    i=at(t); j=min(N,i+len(sig)); mix[i:j]+=g*sig[:j-i]
def env(n,a,d): 
    t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/d)
def kick():
    n=int(.45*SR); t=np.arange(n)/SR; f=48+90*np.exp(-t*28)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.002,.16)*1.0
def snare():
    n=int(.3*SR); t=np.arange(n)/SR; nz=rng.standard_normal(n)
    nz=np.convolve(nz,[1,-0.6],'same')
    return (0.55*nz*env(n,.001,.07)+0.4*np.sin(2*np.pi*190*t)*env(n,.001,.05))
def hat(o=False):
    n=int((.18 if o else .05)*SR); nz=rng.standard_normal(n); nz=np.diff(np.r_[0,nz])
    return nz*env(n,.0005,.06 if o else .012)*0.22
def note(f,dur,kind='keys'):
    n=int(dur*SR); t=np.arange(n)/SR
    if kind=='bass':
        s=np.sin(2*np.pi*f*t)+0.25*np.sin(2*np.pi*2*f*t); return np.tanh(1.4*s)*env(n,.008,dur*.7)*0.55
    if kind=='bell':
        s=np.sin(2*np.pi*f*t+1.2*np.sin(2*np.pi*f*3.5*t)*np.exp(-t*6)); return s*env(n,.003,.55)*0.28
    s=np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*2*f*t)+0.1*np.sin(2*np.pi*3*f*t)
    trem=1+0.15*np.sin(2*np.pi*4.5*t); return s*trem*env(n,.01,dur*.9)*0.07
def hz(m): return 440*2**((m-69)/12)
# i - VI - III - VII : C#m7, Amaj7, Emaj7, B(add9)
chords=[[61,64,68,71],[57,61,64,68],[64,68,71,75],[59,63,66,73]]
roots=[37,33,40,35]
motif=[(0,73),(1,75),(2,80),(3.5,80)]  # chai motif Sa Re Pa (C#5 D#5 G#5)
for b in range(NB):
    t0=b*BAR; c=chords[b%4]; full = 2<=b<=13; hook = 6<=b<=9 or b==14
    if b<=15:
        for m in c: add(note(hz(m),BAR*0.98),t0)
        if b>=2 and b<=14: 
            add(note(hz(roots[b%4]),B*1.6,'bass'),t0); add(note(hz(roots[b%4]),B*0.9,'bass'),t0+2.5*B)
    if full or b==14:
        for k in (0,2.5): add(kick(),t0+k*B,0.9)
        if b%2==1: add(kick(),t0+3.25*B,0.6)
        for k in (1,3): add(snare(),t0+k*B+0.012,0.8)
        for k in range(8):
            sw = 0.04*B if k%2 else 0   # swing
            add(hat(k==7),t0+k*B/2+sw,0.9 if k%2==0 else 0.6)
    if b in (0,1) or hook or b==15:
        for k,m in motif: add(note(hz(m),B*1.2,'bell'),t0+k*B, 1.0 if hook else 0.8)
# vinyl crackle + lowpass-ish smoothing
crackle=np.zeros(N); idx=rng.integers(0,N,size=int(NB*BAR*18)); crackle[idx]=rng.standard_normal(len(idx))*0.08
mix+=np.convolve(crackle,np.ones(6)/6,'same')+rng.standard_normal(N)*0.003
mix=np.convolve(mix,[0.5,0.3,0.2],'same')
end=int(NB*BAR*SR); fade=int(1.5*SR); mix[end-fade:end]*=np.linspace(1,0,fade); mix=mix[:end]
mix=mix/np.max(np.abs(mix))*0.89
st=np.stack([mix,np.roll(mix,int(0.012*SR))*0.96],1)
with wave.open('beat.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes())
print('seconds',NB*BAR)
