ports:=-p 3000:3000

include ../maketools/help.mk
include ../maketools/docker.mk

test:: # Runs tests
	make -C node test
	#make -C python test