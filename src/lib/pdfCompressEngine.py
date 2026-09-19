import sys
import io
import os
import argparse
import fitz  # PyMuPDF
from PIL import Image

def compress_pdf(input_path, output_path, level="medium"):
    preset_configs = {
        "strong": {"quality": 45, "max_dim": 900},
        "medium": {"quality": 60, "max_dim": 1200},
        "quality": {"quality": 75, "max_dim": 1600}
    }
    
    cfg = preset_configs.get(level, preset_configs["medium"])
    quality = cfg["quality"]
    max_dim = cfg["max_dim"]
    
    orig_size = os.path.getsize(input_path)
    doc = fitz.open(input_path)
    
    processed_xrefs = set()
    replaced_count = 0
    
    for page in doc:
        for img_info in page.get_images(full=True):
            xref = img_info[0]
            if xref in processed_xrefs:
                continue
            processed_xrefs.add(xref)
            
            try:
                base_img = doc.extract_image(xref)
                if not base_img:
                    continue
                image_bytes = base_img["image"]
                pil_img = Image.open(io.BytesIO(image_bytes))
                w, h = pil_img.size
                
                # Resize if larger than max_dim
                if max(w, h) > max_dim:
                    scale = max_dim / max(w, h)
                    pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
                
                # Normalize color mode to RGB
                if pil_img.mode in ("RGBA", "P"):
                    if pil_img.mode == "RGBA":
                        bg = Image.new("RGB", pil_img.size, (255, 255, 255))
                        bg.paste(pil_img, mask=pil_img.split()[3])
                        pil_img = bg
                    else:
                        pil_img = pil_img.convert("RGB")
                elif pil_img.mode != "RGB":
                    pil_img = pil_img.convert("RGB")
                    
                out_io = io.BytesIO()
                pil_img.save(out_io, format="JPEG", quality=quality, optimize=True)
                new_bytes = out_io.getvalue()
                
                if len(new_bytes) < len(image_bytes):
                    page.replace_image(xref, stream=new_bytes)
                    replaced_count += 1
            except Exception:
                pass
                
    doc.save(output_path, garbage=4, deflate=True)
    final_size = os.path.getsize(output_path)
    return {
        "original_size": orig_size,
        "final_size": final_size,
        "replaced_images": replaced_count
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--level", default="medium", choices=["strong", "medium", "quality"])
    args = parser.parse_args()
    
    res = compress_pdf(args.input, args.output, args.level)
    print(f"DONE:{res['original_size']}:{res['final_size']}:{res['replaced_images']}")
