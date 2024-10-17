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

variable "db_host" {
  type    = string
  default = "default_db_host" # Fallback value
}

variable "db_name" {
  type    = string
  default = "default_db_name"
}

variable "db_user" {
  type    = string
  default = "default_db_user"
}

variable "db_password" {
  type    = string
  default = "default_db_password"
}

variable "port" {
  type    = string
  default = "8080" # Fallback value for the PORT
}
variable "ami_users" {
  type = list(string)
}
ii8jb




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



  #copy the app.zip artifact from GitHub Actions
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
      "DB_HOST_BUILD=${var.db_host}",
      "DB_NAME=${var.db_name}",
      "DB_USER=${var.db_user}",
      "DB_PASSWORD=${var.db_password}",
      "PORT=${var.port}"
    ]
    script = "script.sh"
  }

}

