from unstructured.partition.pdf import partition_pdf
import argparse
import os


def parse_pdf(input_path, output_path):
    output_arr = []
    tokens = partition_pdf(input_path)
    for token in tokens:
        props = token.to_dict()
        output_arr.append(f"{props['type']} | {props['text']}")
    parsed_text = "\n".join(output_arr)
    with open(args.output_path, "w") as f:
        f.write(parsed_text)
    return parsed_text


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.realpath(__file__))
    parser = argparse.ArgumentParser(description="Parse a PDF file.")
    parser.add_argument(
        "-i",
        "--input_path",
        type=str,
        help="Path to the PDF file to be parsed.",
        default=f"{script_dir}/input.pdf",
    )
    parser.add_argument(
        "-o",
        "--output_path",
        type=str,
        help="Path to the output text file parsed from input.",
        default=f"{script_dir}/output.txt",
    )
    args = parser.parse_args()
    print(parse_pdf(args.input_path, args.output_path))
