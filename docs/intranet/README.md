
# Deployment on intranet

**Table of Contents**

- [Deployment on intranet](#deployment-on-intranet)
  - [Whitelisting](#whitelisting)
  - [DNS Resolution](#dns-resolution)
  - [NGINX Setup](#nginx-setup)
  - [VPC](#vpc)
  - [AWS Setup](#aws-setup)
  - [The somewhat acceptable way to do things](#the-somewhat-acceptable-way-to-do-things)
      - [The somewhat acceptable way to get started](#the-somewhat-acceptable-way-to-get-started)
      - [Getting to the console and jumphost](#getting-to-the-console-and-jumphost)
      - [The somewhat acceptable way to deploy things in the jumphost](#the-somewhat-acceptable-way-to-deploy-things-in-the-jumphost)
  - [The somewhat surprising way to deploy](#the-somewhat-surprising-way-to-deploy)


## Whitelisting
On intranet, users access FormSG via the internal URI **https://form.gov.sg**, which is resolved by WOG DNS to a static IP that has been whitelisted against
the following firewalls

- Cloud landing zone
- Agency firewall (GovTech, for us as developers)
- Agency firewall (the respective Agency's, for users)
- End point protection (Symantec on GSIB)


## DNS Resolution
On ITSM, select the *Internal* domain **form.gov.sg**, and create an A Record that points to the static IP. 

If the IP has not been whitelisted, it will not be resolved.


## NGINX Setup
Create an instance which allows public ips. The following AMI comes installed with NGINX

AMI: **ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20190627.1 (ami-0bb35a5dad5658286)**

Place `nginx.conf` at `/etc/nginx/nginx.conf` 

Place `passthrough.conf` at `/etc/nginx/conf.d/passthrough.conf`

To test the configuration, run `sudo nginx -t`

To reload nginx (after making a change), run `sudo service nginx reload`

**Instance Security Group**

Outbound: Allow all traffic

Inbound: 

| Type | Port | Source | Description |
|--|--|--|--|
| SSH | 22 | Jumphost security group | From jumphost | 
| SSH | 22 | Your internet device ip | From internet device | 
| HTTPS | 443 | 10.0.0.0/8 | From intranet  |

## VPC

Name:   cmt-10420004  

ID:  vpc-01cbfc3938c1d542f

**Route Table**

| Destination | Target |  Description |
|--|--|--|
|10.191.83.64/27| local | traffic within the vpc | 
|100.64.10.64/27| local | traffic within the vpc | 
|10.194.166.128/27| local | traffic within the vpc | 
|10.0.0.0/8| transit gateway | allows traffic to and fro other devices on intranet, needed for gsib to connect to our whitelisted ip |
|0.0.0.0/8 | internet gateway | allows traffic to the internet so we can proxy formsg... also needed for direct ssh |

**Network ACL**

Defaults to whatever was set by GCC vendor, I don't understand how I can ssh in directly with this config given that SSH is denied

| Type | Port | Source | Allow/Deny| Description |
|--|--|--|--|--|
|SSH|22|10.194.166.128/25|ALLOW|Set by gcc, cant change this, allows SSH from jumphost|
|SSH|22|0.0.0.0/0|DENY|-|
|RDP|3389|10.194.166.128/25|ALLOW|-|
|RDP|3389|0.0.0.0/0|DENY|-|
|ALL|ALL|0.0.0.0/0|ALLOW|-|
|ALL|ALL|0.0.0.0/0|DENY|-|

## AWS Setup

If the nginx config points to our elasticbeanstalk load balancer, ie where we host production forms, we have to **allow inbound traffic on the load balancer** from the GCC instance.

**Load balancer Security Group**

| Type | Port | Source | Description |
|--|--|--|--|
| HTTPS | 443 | Public IP of GCC Instance | From GCC | 
| HTTPS | 443 | cloudflare ips | From cloudflare | 

 #### Do not setup passthrough to domain that is proxied by cloudflare
 
 - Initially, the passthrough config pointed to `form.gov.sg:443` instead of the `xxx.ap-southeast-1.elb.amazonaws.com:443` url. [Cloudflare will block the request](https://community.cloudflare.com/t/community-tip-fixing-error-403-forbidden/53308) and  serve a 403 Forbidden response for SSL connections to subdomains that aren’t covered by any Cloudflare or uploaded SSL certificate.
 - This also means that to support SSL, we need to **attach an SSL cert for form.gov.sg**  on the load balancer. It's already done as part of the setup to support Full SSL (Strict) between Cloudflare and our origin servers.

## The somewhat acceptable way to do things

 #### The somewhat acceptable way to get started

- Get yourself provisioned a VPN ID, Jumphost ID, and Cloud ID
- Get an Intunes license for your internet device
- Follow a set of instructions (search for VPN Guide for MacOS.pdf in our google drive) to install VPN, certs, Intunes, and PCoIP
- You'll have to install an antivirus... I got Sophos Home.
- Connect to VPN (vpn-aws.gcc.gov.sg) and sign in with VPN ID
- Follow instructions on the popup to 'enroll' 
    
#### Getting to the console and jumphost

- Connect to VPN
- Now you should be able to view AWS console via myapps.microsoft.com
    - Sign in with Cloud ID (if prompted to install Microsoft Authenticator, click on the link 'Configure app without notifications' -- it'll generate another QR code you can use with Authy)
    - If you don't see Amazon Web Services on myapps, ask your Cloud Admin to add you to the Billing Account 
- You should be able to connect to the jumphost ip (the -ie one, for accessing via internet) with your jumphost id, via PCoIP

#### The somewhat acceptable way to deploy things in the jumphost

- Since you can't store things in the jumphost, we were recommended to create a *tooling server* which you can then use to ssh into other instances
- Raise a service request to create an IAM instance profile with permissions to call services you need. It has to [allow EC2 to assume that role](https://docs.aws.amazon.com/codedeploy/latest/userguide/getting-started-create-iam-instance-profile.html)
- On AWS console, create an EC2 instance (the *tooling server*) with the following user data (a script that runs on the instance when it is first launched). This switches password auth on, so you can ssh in without a keypair. 

    ```
        #!/usr/bin/bash -ex
        exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
        /usr/bin/sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config
        service sshd restart
        echo "temp-password" | passwd --stdin ec2-user
        passwd -e ec2-user
    ```
    
- Associate that IAM instance profile with the EC2 instance, using AWS console
- Connect to the jumphost using PCoIP
- SSH into your tooling server (be sure that SSH is open to 10.0.0.0/8)
- You are free to use AWS CLI in the server if it has that instance profile.
    - eg. To create an application server, create a keypair and EC2 instance
    - SSH into the application server using the keypair, on the tooling server

## The somewhat surprising way to deploy

- After gaining access to the AWS console (Agency admin has to create a wog user for you), you can create an EC2 instance with a public IP
- Add an internet gateway to the route table of the subnet containing your EC2 instance
- Allow SSH on the security group of that instance
- SSH directly into the EC2 instance (public ip) from your internet device, no need for VPN.
- Hooooboy.

