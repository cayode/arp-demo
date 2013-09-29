#!/bin/bash

sudo nping --delay 10s -c 0 --arp-type arp-request --arp-sender-mac 50:b7:c3:b7:7b:43 --arp-sender-ip 10.1.1.1 10.1.1.4
