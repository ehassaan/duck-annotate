# %%
import tree_sitter_python as tspython
from tree_sitter import Language, Parser, Query
import pandas as pd

PY_LANGUAGE = Language(tspython.language())


# %%
source = bytes(
    """
# test
# asda
def foo():
    \"\"\"Return the pathname of the KOS root directory.\"\"\"
    if bar:
        baz()
""",
    "utf8",
)

parser = Parser(PY_LANGUAGE)
tree = parser.parse(source)

# %%
tree.root_node.children[-1].children[-1].children
# %%

query = """
(
  (comment)* @doc
  .
  [(function_definition
       name: (identifier) @name
     ) @definition.function]
(#strip! @doc "^#\\s*")
(#select-adjacent! @doc @definition.function)
)
"""
# %%

res = Query(PY_LANGUAGE, bytes(query, "utf8")).captures(tree.root_node)

# %%


def parse_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        code = file.read()
    tree = parser.parse(bytes(code, "utf8"))
    return tree


# %%

import tree_sitter_python as tspython
from tree_sitter import Language, Parser, Query

PY_LANGUAGE = Language(tspython.language())
parser = Parser(PY_LANGUAGE)
tree = parse_file("./test_repos/odoo/addons/hr/models/hr_employee.py")

# %%
# print(tree.root_node.children[14].id.text)


query = """
(
  (comment)* @doc
  .
  (function_definition
       name: (identifier) @name
  )
(#strip! @doc "^#\\s*")
(#select-adjacent! @doc)
)
"""
res = Query(PY_LANGUAGE, bytes(query, "utf8")).captures(tree.root_node)

list(map(lambda x: x.text, res["name"]))

# %%

print(tree.root_node.children[14].child_by_field_name("name"))


# %%


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


# %%
import glob

all_chunks = []
for path in glob.glob("./test_repos/odoo/**/*.py", recursive=True):
    all_chunks = all_chunks + get_chunks(path)

chunks = pd.DataFrame(all_chunks)

# %%
print(chunks[chunks["type"] == "decorated_definition"]["text"].values[0])

# %%
print(chunks["type"].unique())
# %%
print(chunks[~chunks["file"].str.contains("__")][1:2]["text"].values[0])

# %%
