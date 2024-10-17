packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8, < 2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-0866a3c8686eaeeba"
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "subnet_id" {
  type    = string
  default = "subnet-081c7c40875804bb7"
}


source "amazon-ebs" "my-ami" {
  region          = "${var.aws_region}"
  ami_name        = "csye6225_f24_app_${formatdate("YYYY_MM_DD", timestamp())}"
  ami_description = "AMI for CSYE-6225"

  ami_regions = [
    "us-east-1",
  ]

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  instance_type = "t2.small"
  source_ami    = "${var.source_ami}"
  ssh_username  = "${var.ssh_username}"
  subnet_id     = "${var.subnet_id}"

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1"
    volume_size           = 8
    volume_type           = "gp2"
  }
}


build {
  sources = [
    "source.amazon-ebs.my-ami",
  ]



  #to copy the app.zip artifact from GitHub Actions
  provisioner "file" {
    source      = "./app.zip"
    destination = "/tmp/app.zip"
  }

  # Unzip the application artifact on the server
  provisioner "shell" {
    inline = [
      "sudo apt-get update -y",           # Update the package list
      "sudo apt-get install unzip -y",    # Install unzip package
      "mkdir -p /tmp/webapp",             # Create the directory for unzipping
      "unzip /tmp/app.zip -d /tmp/webapp" # Unzips the artifact into /tmp/webapp
    ]
  }

  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CHECKPOINT_DISABLE=1",
    ]
    script = "script.sh"
  }

}

