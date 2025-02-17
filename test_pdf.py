import pdfkit
import os

wkhtmltopdf_path = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
print(f"Path exists: {os.path.exists(wkhtmltopdf_path)}")

config = pdfkit.configuration(wkhtmltopdf=wkhtmltopdf_path)
pdfkit.from_string('Hello World!', 'test.pdf', configuration=config)
