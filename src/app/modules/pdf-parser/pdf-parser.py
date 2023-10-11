from unstructured.partition.pdf import partition_pdf
import argparse


def parse_pdf(path):
    output_arr = []
    tokens = partition_pdf(path)
    for token in tokens:
        props = token.to_dict()
        output_arr.append(f"{props['type']} | {props['text']}")
    return "\n".join(output_arr)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse a PDF file.")
    parser.add_argument(
        "path", type=str, help="Path to the PDF file.", default="input.pdf"
    )
    args = parser.parse_args()
    print(parse_pdf(args.path))
