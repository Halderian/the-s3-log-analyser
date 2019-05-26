/* 
    THE S3 LOG ANALYSER
    OBJECT LIST FILTERS
    BY DAVID BLAND
*/

// Application wide variables

function getListObjectDate(objectKey) {
    // Find & extract date string in key if exists then convert to date object
    let searchExp = /20\d{2}-\d{2}-\d{2}/; // Expression to find a date in the format yyyy-mm-dd
    let datePosition = objectKey.search(searchExp);                     
    if (datePosition >= 0) {
        // Extract date part of string
        let dateAsString = objectKey.substring(datePosition, datePosition + 10);
        // Try to convert string to date object and add as object property
        var objectDate = new Date(dateAsString);
        // Check its a real date
        if (!(isNaN(objectDate))) {
            return objectDate;
        } else {
            // If not real add error to stack
            errorStack.push({type: 'List Processing', errorMessage: 'Could not convert to date for key ' + objectKey, severity: 'warning'});
            console.log('Could not convert to date for key ' + objectKey);
            // Return fail
            return false;
        }
    } else {
        // If not date string found add error to stack
        errorStack.push({type: 'List Processing', errorMessage: objectKey + ' does not contain a valid date string', severity: 'warning'});
        console.log(objectKey + ' does not contain a valid date string');
        // Return fail
        return false;
    } 
}

function getListObjectType(objectKey) {
    // If ends in .gz then type CloudFront
    if (objectKey.slice(-3) == '.gz') {
        return "CloudFront";
    } else if (objectKey.slice(-10).indexOf('.') >= 0) { // Filter out common file types (keys which look like extensions .xxx)
        // Add to error stack
        errorStack.push({type: 'List Processing', errorMessage: objectKey + ' has invalid file extension', severity: 'warning'});
        console.log(objectKey + ' has invalid file extension');
        // Return fail
        return false;
    } else {
        // If none of above assume type S3 Log
        return "S3Log"
    }
}

function removeInvalidListObjects() {
    // For each object in the list, check for invalid (false) properties
    let indexesToRemove = []
    awsObjectList.forEach(function(listItem, index) {
        console.table(listItem)
        if (!listItem.dateCreated) {
            // Add to remove list if no date
            indexesToRemove.push(index);
        } else if (!listItem.type) {
            // Add to remove list if no type
            indexesToRemove.push(index);
        }
    });
    // Remove object list items with indexes in remove list
    let removedCount = 0;
    indexesToRemove.reverse(); // Start from highest index to avoid errors as array size changes
    indexesToRemove.forEach(function(indexToRemove) {
        console.log('removing ' + awsObjectList[indexToRemove]['objectKey']);
        awsObjectList.splice(indexToRemove, 1);
        removedCount++;
    });
    return Promise.resolve(removedCount);
}

function getObjectListStats(removedCount = 0) {
    // Start with fresh stats object
    var objectListStats = {
        gzCount: 0,
        s3Count: 0,
        removedCount: removedCount
    };
    awsObjectList.forEach(function(listObject) {
        // Count keys of each type         
        if (listObject.type == "CloudFront") {
            objectListStats.gzCount++;
        } else {
            // Assume S3Log as all others removed already
            objectListStats.s3Count++;
        }
    });
    // Sort Asc by date
    awsObjectList.sort((a, b) => a.dateCreated - b.dateCreated);
    // Get max & min date object (start and end of array)
    objectListStats.maxDate = awsObjectList[awsObjectList.length - 1]['dateCreated'];
    objectListStats.minDate = awsObjectList[0]['dateCreated'];

    // Update display
    displayListStats(objectListStats);

    return Promise.resolve();
}


function displayListStats(objectListStats) {
    // Update gz count
    $('#message-area-api-connect-gz-count').html(`CloudFront Log Files: <i>${objectListStats.gzCount}</i>`);
    // Update other count
    $('#message-area-api-connect-other-count').html(`S3 Log Files: <i>${objectListStats.s3Count}</i>`);
    // Update removed count
    $('#message-area-api-connect-removed-count').html(`Files Ignored: <i>${objectListStats.removedCount}</i>`);
    // Update form elements using min max dates
    $('#info-date-max').text(objectListStats.maxDate.toDateString());
    $('#date-max').attr('min', createDateString(objectListStats.minDate));
    $('#date-max').attr('max', createDateString(objectListStats.maxDate));
    $('#info-date-min').text(objectListStats.minDate.toDateString());
    $('#date-min').attr('min', createDateString(objectListStats.minDate));
    $('#date-min').attr('max', createDateString(objectListStats.maxDate));

    function createDateString(dateObject) {
        // Return date in format yyyy-mm-dd
        if (dateObject.getMonth() < 9) {
            return `${dateObject.getFullYear()}-0${dateObject.getMonth() + 1}-${dateObject.getDate()}`;
        } else {
            `${dateObject.getFullYear()}-${dateObject.getMonth() + 1}-${dateObject.getDate()}`;
        }
    }
    return;
}

function filterByType() {
    // Fill temp object list with selected type of log file only
    // Find list objects with keys ending in .gz and remove all others
    awsObjectListTemp.forEach(function(awsObject, index) {               
        if (!(awsObject.objectKey.slice(-3) == '.gz')) {
            // Remove element from array
            awsObjectListTemp.splice(index,1);
        }
    });

}

function updateSelectedLogFiles() {
    $('#info-num-files-selected').text(awsObjectListTemp.length);
}