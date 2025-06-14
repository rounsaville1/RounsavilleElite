import sys

# Primary node names mapped to their response messages
nodes = {
    "giza plateau": "Synchronizing with Giza Pyramid Node... Done.",
    "lake titicaca": "Establishing link with Titicaca Node... Complete.",
    "sedona": "Connecting to Sedona Vortex Node... Connected."
}

# Alternate terms or shorthand that map to the primary node names
aliases = {
    "giza node": "giza plateau",
    "giza": "giza plateau",
    "titicaca": "lake titicaca",
    "sedona node": "sedona"
}

prompt = (
    "Enter node name (Giza Plateau, Lake Titicaca, Sedona): "
)

try:
    selection = input(prompt).strip().lower()
    # Look up the response either directly or via an alias
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
except KeyboardInterrupt:
    sys.exit("\nUser aborted")
