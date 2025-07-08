import math
import os
import sys
import time

WIDTH = 80
HEIGHT = 40
ANGLE_STEP = 0.1

angle = 0.0

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')


def draw_frame():
    global angle
    buffer = [[' ' for _ in range(WIDTH)] for _ in range(HEIGHT)]
    for i in range(150):
        theta = i * 0.15 + angle
        radius = 0.1 * i
        x = int(WIDTH / 2 + radius * math.cos(theta))
        y = int(HEIGHT / 2 + radius * math.sin(theta))
        if 0 <= x < WIDTH and 0 <= y < HEIGHT:
            buffer[y][x] = '*'
    print('\n'.join(''.join(row) for row in buffer))
    angle += ANGLE_STEP


def main():
    try:
        while True:
            clear_screen()
            draw_frame()
            time.sleep(0.05)
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == '__main__':
    main()
