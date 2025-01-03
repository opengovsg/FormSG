TARGET_DIR=/etc/formsg
ENV_TYPE=$ENV_TYPE
ENV_SITE_NAME=$ENV_SITE_NAME

# create target dir if not exist 
echo "Checking if ${TARGET_DIR} exists..."
if [ ! -d ${TARGET_DIR} ]; then
    echo "Creating directory ${TARGET_DIR} ..."
    mkdir -p ${TARGET_DIR}
    if [ $? -ne 0 ]; then
        echo 'ERROR: Directory creation failed!'
        exit 1
    fi
else
    echo "Directory ${TARGET_DIR} already exists!"
fi

echo "${ENV_TYPE}-general" > $TARGET_DIR/.env
echo "${ENV_TYPE}-captcha" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-turnstile" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-ga" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-intranet" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-sms" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-ndi" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-verified-fields" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-webhook-verified-content" >> $TARGET_DIR/.env
echo "${ENV_TYPE}-wogaa" >> $TARGET_DIR/.env
echo "${ENV_SITE_NAME}-sgid" >> $TARGET_DIR/.env
echo "${ENV_SITE_NAME}-payment" >> $TARGET_DIR/.env
echo "${ENV_SITE_NAME}-cron-payment" >> $TARGET_DIR/.env
echo "${ENV_SITE_NAME}-openai" >> $TARGET_DIR/.env
