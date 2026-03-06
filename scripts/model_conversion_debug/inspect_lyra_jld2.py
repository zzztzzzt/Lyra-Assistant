import sys
from pathlib import Path
import h5py

def debug_jld2(path):
    def _visit(name, obj):
        if isinstance(obj, h5py.Dataset):
            print(f"DS  {name}  shape={obj.shape}  dtype={obj.dtype}")
        else:
            print(f"GRP {name}")
    
    with h5py.File(path, "r") as f:
        print("⭐ ||||||  ROOT KEYS  |||||| ⭐")
        print(list(f.keys()))
        print("\n⭐ ||||||  ALL NODES  |||||| ⭐")
        f.visititems(_visit)
        
        print("\n⭐ ||||||  tstate raw  |||||| ⭐")
        ts = f["tstate"]
        print(type(ts), getattr(ts, 'shape', '-'), getattr(ts, 'dtype', '-'))
        if isinstance(ts, h5py.Dataset) and ts.shape == ():
            val = ts[()]
            print("  scalar value type:", type(val))
            print("  dtype:", val.dtype if hasattr(val, 'dtype') else '-')
            if hasattr(val, 'dtype') and val.dtype.names:
                print("  fields:", val.dtype.names)

def main():
    if len(sys.argv) < 2:
        print("Usage: python inspect_lyra_jld2.py <path_to_.jld2>")
        sys.exit(1)
    debug_jld2(Path(sys.argv[1]))


if __name__ == "__main__":
    main()