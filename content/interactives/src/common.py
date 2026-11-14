# Small builders for the interactive pieces. Every text is {"en": ..., "hi": ...}.

def B(en, hi):
    return {"en": en, "hi": hi}

def opt(en, hi, best, why_en, why_hi):
    """A choice in a 'You decide' round."""
    return {"text": B(en, hi), "best": best, "why": B(why_en, why_hi)}

def item(en, hi, bucket=None, why=None, note=None):
    """An item to order (no bucket) or sort (bucket index)."""
    out = {"text": B(en, hi)}
    if bucket is not None:
        out["bucket"] = bucket
    if why is not None:
        out["why"] = why
    if note is not None:
        out["note"] = note
    return out

def pair(a_en, a_hi, b_en, b_hi):
    return {"a": B(a_en, a_hi), "b": B(b_en, b_hi)}

def st(en, hi, true, why_en, why_hi):
    """A statement to mark true or false."""
    return {"text": B(en, hi), "answer": true, "why": B(why_en, why_hi)}
