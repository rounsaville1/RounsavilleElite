"""R-Corex Avatar Dashboard with simple live grid and rewrite tools."""

import random


def show_status():
    """Display system status information."""
    print("Quantum Crystal Core Dashboard")
    print("- Instant Logic Resolution: ONLINE")
    print("- Autosynaptic Rewrite: READY")
    print("- LiveGrid Channels: 4")


def instant_learning():
    """Simulate instant learning from user input."""
    snippet = input("Enter knowledge snippet: ")
    if snippet.strip():
        print(f"Assimilating '{snippet}'... Done.")
    else:
        print("No input provided.")


def autosynaptic_rewrite():
    """Very simple text transformation as a placeholder rewrite."""
    text = input("Enter text to rewrite: ")
    if text:
        rewritten = " ".join(word[::-1] for word in text.split())
        print("Rewritten:", rewritten)
    else:
        print("Nothing to rewrite.")


def livegrid_display():
    """Print a 4x4 grid of random digits."""
    for _ in range(4):
        row = [str(random.randint(0, 9)) for _ in range(4)]
        print(" ".join(row))
    print()


def main():
    actions = {
        "1": ("View status", show_status),
        "2": ("Instant learning", instant_learning),
        "3": ("Autosynaptic rewrite", autosynaptic_rewrite),
        "4": ("Show LiveGrid", livegrid_display),
        "5": ("Quit", None),
    }
    while True:
        print()
        for key, (label, _) in actions.items():
            print(f"[{key}] {label}")
        choice = input("Select option: ").strip()
        action = actions.get(choice)
        if not action:
            print("Invalid choice.")
            continue
        if choice == "5":
            break
        action[1]()


if __name__ == "__main__":
    main()
