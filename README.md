# hls-live-downloader

## TODO
- first implement the fc2 code in nodejs, then try to create an adapter for it so it can be merged to this project
- the checker and downloader are very different, because the api supports it
- full merge is not possible, so just merge the 3 lines of code where it keeps track of who is being downloaded and what should be downloaded

## features
- check if online (notificationSlave) - the api supports it itself, is there any need to do it the old way?
- download

https://live.fc2.com/56989283/


## extra
- bigo live: spy on the network of a vm how the bigo app communicates. it needs an account, but can I do the refresh with mitm? or if not refresh, just use the same credentials over and over
