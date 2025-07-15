import fitz  # PyMuPDF
import json


def pdf_to_json(pdf_path):
    # Open the PDF file
    pdf_document = fitz.open(pdf_path)

    # Initialize a dictionary to store the text
    pdf_text = {"pages": []}

    # Iterate through each page
    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        text = page.get_text("text")
        pdf_text["pages"].append({"page_number": page_num + 1, "text": text})

    # Convert the dictionary to a JSON string
    return json.dumps(pdf_text, indent=4)


# Example usage
json_output = pdf_to_json("../SourceFiles/UP_MOD_XLS.pdf")
print(json_output)