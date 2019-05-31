/* 
    THE S3 LOG ANALYSER
    FORMS AND MESSAGE AREA MANAGEMENT
    BY DAVID BLAND
*/

// Application wide variables
var saveCredsFlag = false;

// Disable standard form submit behavour (reload page)
$(document).submit(function(event){
    event.preventDefault();
});

// Initial functions to run
checkSavedCredsButtonState();
getAwsRegions();

/* FORM DISPLAY */

// Enable/disable API Credentials form
function enableCredsForm(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#form-api-creds :input').prop('disabled', false);
        $('#buttons-load-saved :input').prop('disabled', false);
        // Check saved creds button state having just enabled it
        checkSavedCredsButtonState();
    } else {
        //Disable form fields & buttons
        $('#form-api-creds :input').prop('disabled', true);
        $('#buttons-load-saved :input').prop('disabled', true);
    }
}

// Enable/disable Filter Logs form by type
function enableFilterByTypeForm(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#fieldset-log-file-type :input').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#fieldset-log-file-type :input').prop('disabled', true);
    }
}

// Enable/disable Filter Logs form by date
function enableFilterByDateForm(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#fieldset-log-file-date :input').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#fieldset-log-file-date :input').prop('disabled', true);
    }
}

function enableFilterByPresetForm(yes) {};

// Reset API Credentials Form
function resetCredsForm() {
    $('#form-api-creds')[0].reset(); 
}

// Reset Filter Logs Form
function resetFilterForm() {
    $('#form-filter-log-files')[0].reset();
}

/* MESSAGE AREAS */

function updateApiMessageArea(numObjects) {
    // Update the counter for number of object found in message area
    $('#message-area-api-connect-counter').html(`Objects found: <strong>${numObjects}</strong>`);
}

// Clear API message area
function clearApiMessageArea() {
    $('#message-area-api-connect div').empty();
}

// Clear Load Logs message area
function clearLoadLogsMessageArea() {
    $('#message-area-load-logs div').empty();
}

/* RESETS */

// Reset Page
function resetPage() {
    // Reset forms
    resetCredsForm();
    resetFilterForm();
    // Disable filter form and enable creds form
    enableCredsForm(true);
    enableFilterByTypeForm(false);
    enableFilterByDateForm(false);
    enableFilterByPresetForm(false);
    // Clear message areas
    clearApiMessageArea();
    clearLoadLogsMessageArea();
    // Clear down application wide variablse
    errorStack = [];
    awsObjectList = [];
}

/* AWS REGION DROPDOWN */

// Load list of AWS regions into creds form
function getAwsRegions() {
    let awsRegions = [
        "us-east-2",
        "us-east-1",
        "us-west-1",
        "us-west-2",
        "ap-east-1",
        "ap-south-1",
        "ap-northeast-2",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-northeast-1",
        "ca-central-1",
        "cn-north-1",
        "cn-northwest-1",
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-north-1",
        "sa-east-1",
        "us-gov-east-1",
        "us-gov-west-1",
    ]
    // For each region in the array add an option element to the form dropdown
    awsRegions.forEach(function(region) {
        $('#aws-region-select').append(`<option value="${region}">${region}</option>`);
    });
    // Pre select 'eu-west-2' as region
    $('#aws-region-select option[value="eu-west-2"]').attr("selected", true);
}
    

/* FORM SUBMISSION */

// Triggered on submission of credentials form
function submitCredsForm(formCreds) {

    // Disable creds form whilst processing
    enableCredsForm(false);

    // Write loading to message area
    $('#message-area-api-connect-loading').text('Loading...');

    // Create object holding AWS Creds
    let awsCreds = {
        awsRegion: formCreds.awsRegion.value,
        keyId: formCreds.keyId.value,
        keySecret: formCreds.keySecret.value,
        bucketName: formCreds.bucketName.value
    }
    console.table(awsCreds);

    // Invoke function to list objects and handle promise
    awsListObjects(awsCreds).then(function(success) {
            // Update message area
            $('#message-area-api-connect-loading').text('Success!');            
            // Enable filter form
            enableFilterByTypeForm(true);
        }).catch(function(error) {
            // Call error display function
            displayErrors();                              
        });

    // Save creds
    saveCreds(awsCreds);

    return false;
}

// Triggered on submission of filter form
function submitFilterForm() {
    // Disable filter form whilst processing
    enableFilterByTypeForm(false);
    enableFilterByDateForm(false);
    enableFilterByPresetForm(false);

    // Write loading to message area
    $('#message-area-load-logs').text('Loading...');

    // Convert list crossfilter to array of keys to retrieve
    let awsGetList = dateDim.top(Infinity);
    
    // Generate a get request for each key in the list
    awsGetList.forEach(function(listItem) {
        console.log(listItem.objectKey);
        // Invoke function to get objects and handle promise
        awsGetObject(listItem).then(function(success) {
            console.log(success);
        }).catch(function(error) {
            // Call error display function
            displayErrors();                          
        });
    });

    return false; 
}

/* SAVED CREDENTIALS */

// Save credentials (if flag set)
function saveCreds(awsCreds) {
    if (saveCredsFlag) {
        // Save credentials locally with property name to match those in awsCreds object
        for (var property in awsCreds) {
            localStorage.setItem(property, awsCreds[property]);    
        }      
    }
}

// Load saved credentials
function loadSavedCreds() {
    // Input data into form fields
    $('#access-key-id').val(localStorage.getItem('keyId'));
    $('#access-key-secret').val(localStorage.getItem('keySecret'));
    $('#aws-region-select').val(localStorage.getItem('awsRegion'));
    $('#bucket-name').val(localStorage.getItem('bucketName'));
}

// Clear saved credentials
function clearSavedCreds() {    
    localStorage.clear();
    // Check saved creds button state (to disable)
    checkSavedCredsButtonState();
}

// Check if it looks like saved cred are avaiable and enable button accordingly
function checkSavedCredsButtonState() {    
    if (localStorage.length > 0) {
        $('#buttons-load-local-saved :input').prop('disabled', false);
    } else {
        $('#buttons-load-local-saved :input').prop('disabled', true);
    }
}

/* DEMO CREDENTIALS */