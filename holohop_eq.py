"""Generate a multi-layer "holohop EQ" sound sample."""

import os
import wave
import math
import struct

SAMPLE_RATE = 44100
DURATION = 2.0  # seconds
AMPLITUDE = 16000
OUTPUT_DIR = "audio_samples"


def write_wave(filename, samples):
    """Write a mono WAV file from a sequence of samples."""
    with wave.open(filename, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        frames = b"".join(
            struct.pack("<h", max(min(int(s), 32767), -32768)) for s in samples
        )
        wf.writeframes(frames)


def generate_knock():
    """Create a short percussive knock/clap sample."""
    length = int(0.05 * SAMPLE_RATE)
    return [
        AMPLITUDE
        * math.sin(2 * math.pi * 200 * t / SAMPLE_RATE)
        * math.exp(-5 * t / length)
        for t in range(length)
    ]


def pattern():
    """Base knock pattern spread across the duration."""
    samples = [0.0] * int(SAMPLE_RATE * DURATION)
    knock = generate_knock()
    spacing = SAMPLE_RATE // 4
    for i in range(0, len(samples), spacing):
        for j, val in enumerate(knock):
            if i + j < len(samples):
                samples[i + j] += val
    return samples


def clap_enhancement(samples):
    """Overlay lighter claps between knocks."""
    clap = [0.5 * s for s in generate_knock()]
    spacing = SAMPLE_RATE // 4
    offset = spacing // 2
    for i in range(offset, len(samples), spacing):
        for j, val in enumerate(clap):
            if i + j < len(samples):
                samples[i + j] += val
    return samples


def bass_clarifier(samples):
    """Boost low frequencies with a sine wave."""
    for i in range(len(samples)):
        samples[i] += 0.3 * AMPLITUDE * math.sin(2 * math.pi * 60 * i / SAMPLE_RATE)
    return samples


def snuf_melody(samples):
    """Add a simple rising melody line."""
    seq = [220, 330, 440, 660]
    step = len(samples) // len(seq)
    for idx, freq in enumerate(seq):
        for t in range(step):
            i = idx * step + t
            if i < len(samples):
                samples[i] += 0.2 * AMPLITUDE * math.sin(2 * math.pi * freq * t / SAMPLE_RATE)
    return samples


def distortion_layer(samples):
    """Apply soft clipping."""
    thresh = AMPLITUDE * 0.8
    for i, s in enumerate(samples):
        if s > thresh:
            samples[i] = thresh
        elif s < -thresh:
            samples[i] = -thresh
    return samples


def echo_layer(samples):
    """Add a short echo effect."""
    delay = int(0.1 * SAMPLE_RATE)
    for i in range(delay, len(samples)):
        samples[i] += 0.6 * samples[i - delay]
    return samples


def normalize(samples):
    """Scale to the target amplitude."""
    max_amp = max(abs(s) for s in samples)
    if max_amp == 0:
        return samples
    scale = AMPLITUDE / max_amp
    return [s * scale for s in samples]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    samples = pattern()
    # Apply seven sequential logic layers
    layers = [
        clap_enhancement,
        bass_clarifier,
        snuf_melody,
        distortion_layer,
        echo_layer,
        normalize,
    ]
    for layer in layers:
        samples = layer(samples)
    write_wave(os.path.join(OUTPUT_DIR, "holohop_eq.wav"), samples)


if __name__ == "__main__":
    main()
