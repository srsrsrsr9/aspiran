# Offline guide-vocal TTS via eSpeak NG (generic synthetic voice, imitates no one).
import ctypes, wave, sys, espeakng_loader as E
lib=ctypes.CDLL(E.get_library_path())
CB=ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
buf=[]
@CB
def cb(wav,n,ev):
    if wav and n>0: buf.append(ctypes.string_at(wav,n*2))
    return 0
lib.espeak_Initialize.restype=ctypes.c_int
sr=lib.espeak_Initialize(2,0,E.get_data_path().encode(),0)  # AUDIO_OUTPUT_SYNCHRONOUS
lib.espeak_SetSynthCallback(cb)
def say(text,voice,out,rate=170,pitch=45):
    buf.clear()
    lib.espeak_SetVoiceByName(voice.encode())
    lib.espeak_SetParameter(1,rate,0); lib.espeak_SetParameter(3,pitch,0); lib.espeak_SetParameter(4,30,0)
    t=text.encode('utf-8')+b'\0'
    lib.espeak_Synth(t,len(t),0,0,0,0x01,None,None)  # espeakCHARS_UTF8
    lib.espeak_Synchronize()
    with wave.open(out,'wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(b''.join(buf))
if __name__=="__main__": say(sys.argv[1],sys.argv[2],sys.argv[3])
