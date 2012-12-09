#!/usr/bin/env Rscript

#######################################################################
# DATA ANALYTICS: CRIME SCORE PROJECT                                 #
# WORKING CODE AS OF 12/8/2012                                       #
# andy hoegh                                                          #
#######################################################################


setwd("/var/www/crimescore/")
start.time=Sys.time()
#install.packages("~/Dropbox/Data Analytics/Mac Packages/geoPlot_2.0.tgz", repos = NULL)
#install.packages("~/Dropbox/Data Analytics/Mac Packages/plotGoogleMaps_1.3.tgz", repos = NULL)
#install.packages("~/Dropbox/Data Analytics/Mac Packages/randomForest_4.6-7.tgz", repos = NULL)
#install.packages('geoPlot')
#install.packages('sp')
#install.packages('rgdal')
#install.packages('maptools')
#install.packages('rjson')
#install.packages('randomForest')

library(randomForest)
library(geoPlot)
library(Rook)

#######################################################################
# PART 1 CREATE CRIME SCORE using violent crimes                      #
# for randomly selected points in Washington DC                       #
#######################################################################


#Function for calculating distance between a point and a vector 
#of Lat & Long coordinates Using Haversine Formula -results in Km
dist.vec<-function(xlat,xlong,ylat,ylong){
  n=length(ylat)
  d=rep(0,n)
  for (i in 1:n){
    R = 6371
    dLat = degrees2radians(ylat[i]-xlat)
    dLon = degrees2radians(ylong[i]-xlong)
    lat1 = degrees2radians(xlat)
    lat2 = degrees2radians(ylat[i])
    a = sin(dLat/2)*sin(dLat/2)+sin(dLon/2)*sin(dLon/2)*cos(xlat)*cos(ylat[i])
    c = 2 * atan2(sqrt(a), sqrt(1-a)); 
    val = R * c
    d[i]=val
  }
  return(d)
}


#######################################################################
# PART 2 IMPORT COVARIATE INFORMATION                      #
#######################################################################
#Function Calculating Number of Units in a given radius
count.inRadius<-function(sample.lat,sample.long,attribute.lat,attribute.long,threshold=1){
  rows=length(sample.lat)
  cols=length(attribute.lat)
  d.mat=matrix(0,rows,cols)
  count=rep(0,rows)
  for (i in 1:rows){
    d.mat[i,]=dist.vec(sample.lat[i],sample.long[i],attribute.lat,attribute.long)
    count[i]=sum(d.mat[i,]< threshold)
  }
  return(count)
}

#Function to extract coordinates
parse.coord<-function(char.string){
  lat=long=rep(0,dim(char.string)[1])
  for (i in 1:dim(char.string)[1]){
    lat[i]=strsplit(as.character(char.string[i,]),' ')[[1]][1]
    lat[i]=as.numeric(substr(lat[i],7,nchar(lat[i])-1))
    long[i]=strsplit(as.character(char.string[i,]),' ')[[1]][2]
    long[i]=as.numeric(substr(long[i],1,nchar(long[i])-1))
  }
  lat=as.numeric(lat)
  long=as.numeric(long)
  return(cbind(lat,long))
}

#Function Calculating Distance to Nearest Element
dist.toNearest<-function(sample.lat,sample.long,attribute.lat,attribute.long){
  rows=length(sample.lat)
  cols=length(attribute.lat)
  d.mat=matrix(0,rows,cols)
  dist=rep(0,rows)
  for (i in 1:rows){
    d.mat[i,]=dist.vec(sample.lat[i],sample.long[i],attribute.lat,attribute.long)
    dist[i]=min(d.mat[i,])
  }
  return(dist)
}

# Import Military
military=read.csv('data/Military.csv')
military.coord=parse.coord(military)

#Import Police_stations
police=read.csv('data/Police_Stations.csv')
police.coord=parse.coord(police)

#Import Public Housing
pub.housing=read.csv('data/Pub_Housing.csv')
pub.housing.coord=parse.coord(pub.housing)

#Import Universities
universities=read.csv("data/Universities.csv")
university.coord=parse.coord(universities)

# Import Liquor license data
l1=read.csv('data/Liquor1.csv')
l2=read.csv('data/Liquor2.csv')
liquor=rbind(l1,l2)
#lat & long are reversed
liquor$LAT=liquor$long
liquor$LONG=liquor$lat

# Import Registered Property data
RegProp=read.csv('data/RegProp.csv')
#Delete unimportant variables and missing data
RegProp.Sub=subset(RegProp,select=c(USECODE,USECODEDESCRIPTION,NEWTOTALASSESSMENT,
                                    LATITUDE,LONGITUDE),c(USECODE >0 & LATITUDE >0 & NEWTOTALASSESSMENT >0))

#Identify various groups of usecode
banks=subset(RegProp.Sub,USECODEDESCRIPTION=='COMMERCIAL-BANKS, FINANCIAL')
barber=subset(RegProp.Sub,USECODEDESCRIPTION=='STORE-BARBER/BEAUTY SHOP')
carlot=subset(RegProp.Sub,USECODEDESCRIPTION=='COMMERCIAL-GARAGE, VEHICLE SALE')
dorm=subset(RegProp.Sub,USECODEDESCRIPTION=='DORMITORY' | USECODEDESCRIPTION=='FRATERNITY/SORORITY HOUSE')
education=subset(RegProp.Sub,USECODEDESCRIPTION=='EDUCATIONAL')
embassy=subset(RegProp.Sub,USECODEDESCRIPTION=='EMBASSY, CHANCERY, ETC.')
hospital=subset(RegProp.Sub,USECODEDESCRIPTION=='HEALTH CARE FACILITY' | USECODEDESCRIPTION=='MEDICAL')
hotel=subset(RegProp.Sub,USECODEDESCRIPTION=='HOTEL-LARGE' | USECODEDESCRIPTION=='HOTEL-SMALL' | USECODEDESCRIPTION=='INN' | USECODEDESCRIPTION=='MOTEL' | USECODEDESCRIPTION=='TOURIST HOMES')
industrial=subset(RegProp.Sub,USECODEDESCRIPTION=='INDUSTRIAL-TRUCK TERMINAL' | USECODEDESCRIPTION=='INDUSTRIAL-LIGHT' | USECODEDESCRIPTION=='INDUSTRIAL-MISC.' | USECODEDESCRIPTION=='INDUSTRIAL-RAW MATERIAL HANDLING' | USECODEDESCRIPTION=='INDUSTRIAL-WAREHOUSE-1-STORY' | USECODEDESCRIPTION=='INDUSTRIAL-WAREHOUSE-MULTI-STORY')
museum=subset(RegProp.Sub,USECODEDESCRIPTION=='MUSEUM, LIBRARY, GALLERY')
recreation=subset(RegProp.Sub,USECODEDESCRIPTION=='RECREATIONAL')
religious=subset(RegProp.Sub,USECODEDESCRIPTION=='RELIGIOUS')
vacant=subset(RegProp.Sub,USECODEDESCRIPTION=='VACANT-COMMERCIAL USE' | USECODEDESCRIPTION=='VACANT-FALSE-ABUTTING' | USECODEDESCRIPTION=='VACANT-IMPROVED AND ABANDONED'| USECODEDESCRIPTION=='VACANT-TRUE' | USECODEDESCRIPTION=='VACANT=UNIMPROVED PARKING' | USECODEDESCRIPTION=='VACANT-WITH PERMIT' | USECODEDESCRIPTION=='VACANT-ZONING LIMITS')
vehicleservice=subset(RegProp.Sub,USECODEDESCRIPTION=='VEHICLE SERVICE STATION-MARKET' | USECODEDESCRIPTION=='VEHICLE SERVICE STATION -KIOSK' | USECODEDESCRIPTION=='VEHICLE SERVICE STATION-VINTAGE')

#Function containing Distance Calculations
do.distance<-function(lat,long){
  # Do distance calculations
  vehicleservice.count=count.inRadius(lat,long,vehicleservice$LAT,vehicleservice$LONG)
  vacant.count=count.inRadius(lat,long,vacant$LAT,vacant$LONG)
  religious.count=count.inRadius(lat,long,religious$LAT,religious$LONG)
  recreation.count=count.inRadius(lat,long,recreation$LAT,recreation$LONG)
  museum.count=count.inRadius(lat,long,museum$LAT,museum$LONG)
  industrial.count=count.inRadius(lat,long,industrial$LAT,industrial$LONG)
  hotel.count=count.inRadius(lat,long,hotel$LAT,hotel$LONG)
  hospital.count=count.inRadius(lat,long,hospital$LAT,hospital$LONG)
  embassy.count=count.inRadius(lat,long,embassy$LAT,embassy$LONG)
  education.count=count.inRadius(lat,long,education$LAT,education$LONG)
  dorm.count=count.inRadius(lat,long,dorm$LAT,dorm$LONG)
  carlot.count=count.inRadius(lat,long,carlot$LAT,carlot$LONG)
  barber.count=count.inRadius(lat,long,barber$LAT,barber$LONG)
  liq.count=count.inRadius(lat,long,liquor$LAT,liquor$LONG)
  banks.count=count.inRadius(lat,long,banks$LAT,banks$LONG)
  
  military.dist=dist.toNearest(lat,long,military.coord[,1],military.coord[,2])
  police.dist=dist.toNearest(lat,long,police.coord[,1],police.coord[,2])
  pub.housing.dist=dist.toNearest(lat,long,pub.housing.coord[,1],pub.housing.coord[,2])
  university.dist=dist.toNearest(lat,long,university.coord[,1],university.coord[,2])

  dat=cbind(lat,long,liq.count,banks.count,barber.count,carlot.count,dorm.count,
            education.count,embassy.count,hospital.count,hotel.count,industrial.count,
            museum.count,recreation.count,religious.count,vacant.count,vehicleservice.count,
            military.dist,police.dist,pub.housing.dist,university.dist)
  
  return(dat)
}
comb.dat=read.csv('data/pred.file.csv')

#######################################################################
# PART 3 FIT RANDOM FOREST MODEL                  #
#######################################################################
#Fit Random Forest
set.seed(1282012)
comb.dat=comb.dat[,-1]

#Partial dependence plots of 9 most important variables
rf2=randomForest(crime.scores~.,data=comb.dat,importance=T)

#######################################################################
# PART 4 PREDICTION USING RANDOM FOREST MODEL                  #
#######################################################################
#Prediction of individual point

Predict.CrimeScore<-function(lat,long){
  dat.test=data.frame(do.distance(lat,long))
  return(predict(rf2,dat.test))
}

Predict.CrimeScore.Vec<-function(vec.in){
  vec=strsplit(vec.in,',')[[1]]
  out=''
  for (i in 1:(length(vec)/2)){
    cs=Predict.CrimeScore(as.numeric(vec[((i-1)+1)]),as.numeric(vec[2*i]))
    #out=paste(out,c(vec[((i-1)+1)],vec[2*i],cs),sep=,)
    out=paste(out,c(vec[((i-1)+1)]),sep=',')
    if (i==1) out=as.character(vec[((i-1)+1)])
    out=paste(out,c(vec[2*i]),sep=',')
    out=paste(out,cs,sep=',')
  }
  return(out)
}

Predict.CrimeScore.JSON<-function(vec.in){
	vec <- strsplit(vec.in,',')[[1]]
	out.list <- list()

	for (i in 1:(length(vec)/2)){
		# cs = i
		cs=Predict.CrimeScore(as.numeric(vec[((i*2)-1)]),as.numeric(vec[i*2]))
		out.list[[i]] <- list(latitude=vec[((i*2)-1)], longitude=vec[i*2], crimescore=as.character(cs))
	}
	total.list=list(places=out.list)
	print(toJSON(total.list))
	return(toJSON(total.list))
}
# 
# coord.lat=c(38.8325192140698,38.90398)
# coord.long=c(-76.9936390021642,-77.05510)
# coord=cbind(coord.lat,coord.long)
# Predict.CrimeScore(coord.lat,coord.long)
# 
#######################################################################
# PART 5 CITY PLANNER ASSESSMENT #
#######################################################################
#Prediction of individual point
coord.lat=c(38.8325192140698)
coord.long=c(-76.9936390021642)
coord=cbind(coord.lat,coord.long)
dat.test=data.frame(do.distance(coord.lat,coord.long))
predict(rf2,dat.test)

City.Planner<-function(lat,long){
  dat.test=data.frame(do.distance(coord.lat,coord.long))
  Crime.Score=predict(rf2,dat.test)    
  return(cbind(Crime.Score,dat.test))
}
City.Planner(coord.lat,coord.long)

Sys.time()-start.time

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
			res$header('Content-type', 'application/json')
			coordinates <- toString(req$params()["coords"])
			res$write(Predict.CrimeScore.JSON(coordinates))
			res$finish()
		}
	)
	
	# Now make the console go to sleep. Of course the web server will still be
	# running.
	while (TRUE) Sys.sleep(24 * 60 * 60)
}

# If we get here then the web server didn't start up properly
warning("Oops! Couldn't start Rook app")