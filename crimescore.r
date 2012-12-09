#!/usr/bin/env Rscript

library(Rook)

myPort <- 8000
myInterface <- "0.0.0.0"
status <- -1
status <- .Internal(startHTTPD(myInterface, myPort))

if (status == 0) {
	unlockBinding("httpdPort", environment(tools:::startDynamicHelp))
	assign("httpdPort", myPort, environment(tools:::startDynamicHelp))
	
	s <- Rhttpd$new()
	s$listenAddr <- myInterface
	s$listenPort <- myPort
	
	# Change this line to your own application. You can add more than one
	# application if you like
	s$add(name = "test", app = system.file("exampleApps/RookTestApp.R", package = "Rook"))
	
	s$add(name="crimescores",
		app = function(env) {
			req <- Request$new(env)
			res <- Response$new()
			res$write('<pre>')
			coordinates <- toString(req$params()["coords"])
			res$write(c('coords: ',coordinates,'\n'))
			# res$write('crimescores: ')
			# res$write('\n')
			# res$write(Predict.CrimeScore.Vec(coordinates))
			# res$write('\n')
			# res$write('crimescores as JSON: ')
			# res$write('\n')
			# res$write(toJSON(Predict.CrimeScore.Vec(coordinates)))
			res$write('</pre>')
			res$finish()
		}
	)
	
	# Now make the console go to sleep. Of course the web server will still be
	# running.
	while (TRUE) Sys.sleep(24 * 60 * 60)
}

# If we get here then the web server didn't start up properly
warning("Oops! Couldn't start Rook app")