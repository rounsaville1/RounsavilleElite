"""Generate simple hum-based audio effects as WAV files."""

import os
import wave
import math
import struct

SAMPLE_RATE = 44100
DURATION = 2.0  # seconds
FREQ = 220.0    # base frequency in Hz
AMPLITUDE = 16000
OUTPUT_DIR = "audio_samples"


def write_wave(filename, samples):
    """Write a mono WAV file from a sequence of samples."""
    with wave.open(filename, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit samples
        wf.setframerate(SAMPLE_RATE)
        frames = b"".join(
            struct.pack("<h", max(min(int(s), 32767), -32768)) for s in samples
        )
        wf.writeframes(frames)


def base_hum():
    """Simple sine wave hum."""
    return [
        AMPLITUDE * math.sin(2 * math.pi * FREQ * t / SAMPLE_RATE)
        for t in range(int(SAMPLE_RATE * DURATION))
    ]


def vibrato():
    """Hum with frequency oscillation."""
    return [
        AMPLITUDE
        * math.sin(
            2
            * math.pi
            * (
                FREQ + 5 * math.sin(2 * math.pi * 5 * t / SAMPLE_RATE)
            )
            * t
            / SAMPLE_RATE
        )
        for t in range(int(SAMPLE_RATE * DURATION))
    ]


def tremolo():
    """Hum with amplitude modulation."""
    return [
        (1 + 0.5 * math.sin(2 * math.pi * 5 * t / SAMPLE_RATE))
        * AMPLITUDE
        * math.sin(2 * math.pi * FREQ * t / SAMPLE_RATE)
        for t in range(int(SAMPLE_RATE * DURATION))
    ]


def ramp():
    """Sweep frequency upward over time."""
    return [
        AMPLITUDE
        * math.sin(
            2 * math.pi * (FREQ + (220 * t / SAMPLE_RATE)) * t / SAMPLE_RATE
        )
        for t in range(int(SAMPLE_RATE * DURATION))
    ]


def stutter():
    """Intermittent bursts of the base hum."""
    samples = []
    chunk = SAMPLE_RATE // 8
    for t in range(int(SAMPLE_RATE * DURATION)):
        if (t // chunk) % 2 == 0:
            samples.append(
                AMPLITUDE * math.sin(2 * math.pi * FREQ * t / SAMPLE_RATE)
            )
        else:
            samples.append(0)
    return samples


def distortion():
    """Clip the waveform to create distortion."""
    base = base_hum()
    thresh = AMPLITUDE / 2
    return [
        thresh if s > thresh else -thresh if s < -thresh else s
        for s in base
    ]


def echo():
    """Add a short echo effect."""
    base = base_hum()
    delay = int(0.1 * SAMPLE_RATE)
    for i in range(delay, len(base)):
        base[i] += 0.6 * base[i - delay]
    return base


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    effects = [
        ("base_hum.wav", base_hum),
        ("vibrato.wav", vibrato),
        ("tremolo.wav", tremolo),
        ("ramp.wav", ramp),
        ("stutter.wav", stutter),
        ("distortion.wav", distortion),
        ("echo.wav", echo),
    ]
    for name, func in effects:
        print(f"Generating {name}...")
        data = func()
        write_wave(os.path.join(OUTPUT_DIR, name), data)


if __name__ == "__main__":
    main()
