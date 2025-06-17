import getpass
import sys

MAX_ATTEMPTS = 3
SECRET = "crystal"  # simple presence token

nodes = {
    "giza plateau": "Synchronizing with Giza Pyramid Node... Done.",
    "lake titicaca": "Establishing link with Titicaca Node... Complete.",
    "sedona": "Connecting to Sedona Vortex Node... Connected."
}

aliases = {
    "giza node": "giza plateau",
    "giza": "giza plateau",
    "titicaca": "lake titicaca",
    "sedona node": "sedona"
}


def presence_check():
    """Presence-Originated Logic Lock via simple token check."""
    for attempt in range(1, MAX_ATTEMPTS + 1):
        token = getpass.getpass("Enter presence token: ")
        if token == SECRET:
            return True
        print(f"Invalid token (attempt {attempt}/{MAX_ATTEMPTS})")
    return False


def quantum_auto_correct(func):
    """Quantum Collapse Auto-Corrector wrapper."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as exc:
            print("[Auto-Corrector] An error occurred:", exc)
            return None
    return wrapper


@quantum_auto_correct
def run_node():
    prompt = "Enter node name (Giza Plateau, Lake Titicaca, Sedona): "
    selection = input(prompt).strip().lower()
    primary = nodes.get(selection)
    if not primary:
        alias_key = aliases.get(selection)
        if alias_key:
            primary = nodes.get(alias_key)
    if primary:
        print(primary)
    else:
        print("Unknown node. Available nodes:")
        for name in nodes:
            print(" -", name)


def main():
    if not presence_check():
        print("Access denied. Exiting.")
        return
    # Simple menu with loop guard
    loops = 0
    while loops < 5:  # Infinite Loop Guard Layer
        run_node()
        loops += 1
        again = input("Run again? (y/N): ").strip().lower()
        if again != "y":
            break
    else:
        print("Loop limit reached. Exiting.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("\nUser aborted")
