FROM public.ecr.aws/lambda/python:3.12

# Install deps 
RUN dnf install pango pango-devel -y

COPY wqy-zenhei.ttc /usr/share/fonts/wqy-zenhei/wqy-zenhei.ttc

COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install -r requirements.txt

COPY lambda_function.py ${LAMBDA_TASK_ROOT}

CMD ["lambda_function.handler"]