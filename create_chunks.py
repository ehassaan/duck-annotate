import tree_sitter_python as tspython
from tree_sitter import Language, Parser
import pandas as pd
import argparse
import glob

PY_LANGUAGE = Language(tspython.language())
pyParser = Parser(PY_LANGUAGE)


def parse_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        code = file.read()
    tree = pyParser.parse(bytes(code, "utf8"))
    return tree


def get_name(node):
    if node.child_by_field_name("name") is not None:
        node.child_by_field_name("name").text
    else:
        return None


def get_chunks(file_path, max_chunk_size=1000):
    tree = parse_file(file_path)
    chunks = []
    comment = None
    groups = []
    group_length = 0
    for node in tree.root_node.children:
        if node.type == "comment":
            if node.text is None:
                continue
            if comment is None:
                comment = node.text.decode("utf8")
            else:
                comment = comment + "\n" + node.text.decode("utf8")
            continue

        if node.type in [
            "function_definition",
            "class_definition",
            "decorated_definition",
        ]:
            chunks.append(
                {
                    "file": file_path,
                    "type": "group",
                    "name": None,
                    "comments": None,
                    "text": "\n".join(groups),
                }
            )
            groups = []
            group_length = 0
            chunks.append(
                {
                    "file": file_path,
                    "type": node.type,
                    "name": get_name(node),
                    "comments": comment,
                    "text": node.text.decode("utf8"),
                }
            )
        else:
            if group_length + len(node.text) > max_chunk_size:
                chunks.append(
                    {
                        "file": file_path,
                        "type": "group",
                        "name": None,
                        "comments": None,
                        "text": "\n".join(groups),
                    }
                )
                groups = []
                group_length = 0

            else:
                group = node.text.decode("utf8")
                if comment is not None:
                    group = f"{comment}\n{node.text.decode("utf8")}"
                groups.append(group)
                group_length = group_length + len(node.text)
        comment = None
    return chunks


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_pattern", type=str, required=True)
    parser.add_argument("--max_chunk_size", type=int, default=1000)
    parser.add_argument("--output", type=str, default="chunks.parquet")
    args = parser.parse_args()

    chunks = []
    for path in glob.glob(args.input_pattern, recursive=True):
        chunks += get_chunks(path, args.max_chunk_size)

    pd.DataFrame(chunks).to_parquet(args.output)
