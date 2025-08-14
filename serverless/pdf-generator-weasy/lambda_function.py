import weasyprint
import base64
import json
from weasyprint.text.fonts import FontConfiguration

def handler(event, context):
    try:
        url = event.get('url', '')
        html_content = event.get('html', '')

        font_config = FontConfiguration()

        if url:
            pdf = weasyprint.HTML(url=url).write_pdf(font_config=font_config)
        elif html_content:
            pdf = weasyprint.HTML(string=html_content).write_pdf(
                presentational_hints=True,
                font_config=font_config,
                stylesheets=[
                    weasyprint.CSS(string='''
                        @font-face {
                            font-family: "WenQuanYi Zen Hei";
                            src: url("/usr/share/fonts/wqy-zenhei/wqy-zenhei.ttc") format("truetype-collection");
                        }
                        @page {
                            size: A4;
                            margin: 20px 0px 40px 0px;
                        }
                        body {
                            font-family: "Noto Sans", "WenQuanYi Zen Hei", sans-serif;
                        }
                    ''')
                ]
            )
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