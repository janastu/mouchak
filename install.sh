#!/bin/bash

distro=$(cat /etc/*release | grep "^NAME=" | cut -d \" -f 2 )
version=$(cat /etc/*release | grep "^VERSION_ID=" | cut -d \" -f 2 )

echo "You are running $distro $version!"
exit 0
