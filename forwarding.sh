#!/bin/bash

iptables -t nat --flush
iptables --zero
iptables -A FORWARD --in-interface wlan1 -j ACCEPT
iptables -t nat -A POSTROUTING --out-interface wlan1 -j MASQUERADE
iptables -t nat -A PREROUTING  -p tcp --dport 80 --jump DNAT --to-destination 10.1.1.9
