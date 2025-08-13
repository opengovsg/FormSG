import weasyprint
import base64
import json
from weasyprint.text.fonts import FontConfiguration

def handler(event):
    try:
        url = event.get('url', '')
        html_content = event.get('html', '')

        if url:
            pdf = weasyprint.HTML(url=url).write_pdf()
        elif html_content:
            pdf = weasyprint.HTML(string=html_content).write_pdf()
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No HTML or URL provided'})
            }
        
        return {
            'statusCode': 200,
            'body': base64.b64encode(pdf), 
            'isBase64Encoded': True
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }