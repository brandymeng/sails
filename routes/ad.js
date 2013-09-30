var log = require('log4js').getLogger(), 
	Ad = require("../model/ad"),
	crypto = require('crypto'),
	fs = require('fs'),
	path = require('path');

// Static variable
var	resource_path = "./resource/",
	image_path = "public/client-image";

// Interface for list the ads of store
exports.list = function(req, res) {

	log.info(req.query);
	if (req.query.storeId) {

		Ad.find({
			
			storeId : req.query.storeId
		
		}, function(error, ads) {
			
			console.log(ads);
			res.send(200, ads);

		});

	}

}

// Interface for create the new ad of store
exports.create = function(req, res){
	
	if(req.body.storeId && req.body.name && req.body.price && req.body.desc){
					
		new Ad({				
		    name: req.body.name,
		    price: req.body.price,			    
		    desc: req.body.desc,			    
		    startTime: new Date(),			    		    
		    endTime: new Date(),			    
		    storeId: req.body.storeId							
		}).save(function(error, ad){				
			res.send(200, ad);			
		});	
		
	}
		
}

// Interface for create the new store in specific floor of specific building
exports.update = function(req, res){
	
	log.info(req.body);
	if(req.body._id && req.body.storeId && req.body.name && req.body.price && 
			req.body.desc){
		
		Ad.findById(req.body._id, function(err, ad) {
			
			if (err)
				log.error(err);
			
			if (ad) {				
				
				ad.name = req.body.name;
				ad.price = req.body.price;				
				ad.desc = req.body.desc;
				ad.startTime = new Date(req.body.startTime);
				ad.endTime = new Date(req.body.endTime);
				// ad.storeId = req.body.storeId;				
				ad.save(function(){
					res.send(200, ad);
				});
			}

		});
	}
}		


/*
 * POST Interface of upload image
 */
exports.uploadImage = function(req, res) {

	if(req.body.id && req.files.image){
		
		// Get file name and extension
		var fileName = req.files.image.name;
		var extension = path.extname(fileName).toLowerCase() === '.png' ? ".png" : null ||
						path.extname(fileName).toLowerCase() === '.jpg' ? ".jpg" : null ||
						path.extname(fileName).toLowerCase() === '.gif' ? ".gif" : null;
		
		// Check file format by extension
		if(extension){
			
			var tmpPath = req.files.image.path;
			log.info("tmpPath: " + tmpPath);
			
			// Read file and prepare hash
			var md5sum = crypto.createHash('md5'),
				stream = fs.ReadStream(tmpPath);
			
			// Set target file name by hash the file
			var targetFileName;
			stream.on('data', function(d) {
				md5sum.update(d);
			});			
						
			stream.on('end', function() {

				targetFileName = md5sum.digest('hex')  + extension;
				var targetPath = path.resolve(image_path + "/" + targetFileName);
				log.info("targetPath: " + targetPath);
				
				Ad.findById(req.body.id, function(error, ad){
					
					if(ad){
						
						log.info("image: " + ad.image);
						log.info("targetName: " + targetFileName);						
						if(ad.image != targetFileName){
							
							log.info("Update");
							fs.rename(tmpPath, targetPath, function(err) {			
								if(err){									
									log.error(err);
									res.send(200, "Server error, please try again later");									
								}else{									
									
									ad.image = targetFileName;
									ad.save(function(){
										res.send(200, "/client-image/" + targetFileName);																			
									});
								}										
							});								
							
						}else{
							
							log.info("Same");
							res.send(200, "/client-image/" + targetFileName);							
						}						
						
					}else{
						
						res.send(200, { msg: "This building does not exist" });
						
					}//end if
					
				});
				
			});			
			
		}else{
			
			res.send(200, { msg: "File extension should be .png or .jpg or gif" });
		}
		
		
	}	
	
};