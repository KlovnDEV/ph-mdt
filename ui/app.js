let canSearchForProfiles = true;
let canSaveProfile = true;
let canRefreshBolo = true;
let canRefreshReports = true;
let canSearchForWarrants = true;
let canRefreshWarrants = true;
let canRefreshWeaponReg = true;
let canSearchForWeaponReg = true;
let currentWeaponRegEvents = [];
let currentSelectedWeaponEvent = 0;

let attachedCallsIDs = [];



let canRefreshIncidents = true;
let canInputTag = true;
let canInputBoloTag = true;
let canInputBoloOfficerTag = true;
let canSearchReports = true;
let canCreateBulletin = 0;
let mouse_is_inside = false;
let currentTab = ".dashboard-page-container";
let MyName = "";
let canInputReportTag = true;
let canInputReportOfficerTag = true;
let canInputReportCivilianTag = true;
let canSearchForVehicles = true;
let canSearchForReports = true;
let canSaveVehicle = true;
var LastName = "";
var DispatchNum = 0;
var playerJob = "";
let rosterLink  = "";

let impoundChanged = false;

let savedTab = null;

// TEMP CONFIG OF JOBS
const PoliceJobs = {
  ['police']: true,
  ['fib']: true,
  ['sasp']: true,
  ['bcso']: true,
  ['ranger']: true,
}

const AmbulanceJobs = {
  ['ambulance']: true,
}

const DojJobs = {
  ['lawyer']: true,
  ['judge']:true,
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getFormattedDate(date, prefomattedDate = false, hideYear = false) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  let minutes = date.getMinutes();

  if (minutes < 10) {
    minutes = `0${minutes}`;
  }

  if (prefomattedDate) {
    return `${prefomattedDate} at ${hours}:${minutes}`;
  }

  if (hideYear) {
    return `${day}. ${month} at ${hours}:${minutes}`;
  }

  return `${day}. ${month} ${year}. at ${hours}:${minutes}`;
}

function timeAgo(dateParam) {
  if (!dateParam) {
    return null;
  }

  const date =
    typeof dateParam === "object" ? dateParam : new Date(dateParam);
  const DAY_IN_MS = 86400000;
  const today = new Date();
  const yesterday = new Date(today - DAY_IN_MS);
  const seconds = Math.round((today - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const isThisYear = today.getFullYear() === date.getFullYear();

  if (seconds < 5) {
    return "Just Now";
  } else if (seconds < 60) {
    return `${seconds} Seconds ago`;
  } else if (seconds < 90) {
    return "About a minute ago";
  } else if (minutes < 60) {
    return `${minutes} Minutes ago`;
  } else if (isToday) {
    return getFormattedDate(date, "Today");
  } else if (isYesterday) {
    return getFormattedDate(date, "Yesterday");
  } else if (isThisYear) {
    return getFormattedDate(date, false, true);
  }

  return getFormattedDate(date);
}
var recentSearchedIncidentID = -1;

var recentSearchedReportID = -1;

var recentSearchedWeaponreg = -1;

var recentSearchedBoloID = -1;

var recentSearchedDMVPlate = -1;

var recentSearchedWarrant = -1;

var recentSearchedID = -1;
  async function displayProfileData(id){

      let profileResult = await $.post(
        `https://${GetParentResourceName()}/getProfileData`,
        JSON.stringify({
          id: id,
        })
      );
      console.log("get data for ", profileResult["cid"]);
 
      if ($(".manage-groups-tags-add-btn").hasClass("fa-minus")) {
        $(".manage-groups-tags-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }

    if ($(".gallery-upload-input").css("display") == "block") {
      $(".gallery-upload-input").slideUp(250);
      setTimeout(() => {
        $(".gallery-upload-input").css("display", "none");
      }, 250);
    }

    if ($(".gallery-add-btn").hasClass("fa-minus")) {
      $(".gallery-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }
    

    $(".manage-profile-editing-title").html(`You are currently editing ${profileResult["firstname"]} ${profileResult["lastname"]}`);
    $(".manage-profile-citizenid-input").val(profileResult['cid']);
    $(".manage-profile-name-input-1").val(profileResult["firstname"]);
    $(".manage-profile-name-input-2").val(profileResult["lastname"]);
    $(".manage-profile-dob-input").val(profileResult["dob"]);

    $(".manage-profile-url-input").val(profileResult["profilepic"] ?? "");
    $(".manage-profile-info").val(profileResult["mdtinfo"]);
    $(".manage-profile-info").removeAttr("disabled");

    $(".expunge-btn").data("cid", profileResult['cid']);

    $(".manage-profile-fingerprint").val(profileResult["fingerprint"]);
    $(".manage-profile-fingerprint").removeAttr("disabled");

    $(".manage-profile-phonenumber").val(profileResult["phonenumber"]);
    $(".manage-profile-phonenumber").removeAttr("disabled");
    $(".manage-profile-pic").attr("src", profileResult["profilepic"] ?? "img/male.png");
    
    if(profileResult["probationstatus"]){
      $(".manage-profile-probationstate-title").show();
    }
    else{
      $(".manage-profile-probationstate-title").hide();
    }

    const { vehicles, tags, gallery, convictions, properties } = profileResult

    $(".licenses-holder").empty();
    $(".vehs-holder").empty();
    $(".gallery-inner-container").empty();
    $(".convictions-holder").empty();

    let licencesHTML = '<div style="color: #fff; text-align:center;">No Licenses</div>';
    let tagsHTML = '<div style="color: #fff; text-align:center;">No Groups</div>';
    let convHTML = '<div style="color: #fff; text-align:center;">Clean Record ?</div>';
    let vehHTML = '<div style="color: #fff; text-align:center;">No Vehicles</div>';
    let galleryHTML = '<div style="color: #fff; text-align:center;">No Photos</div>';
    let propertyHTML = '<div style="color: #fff; text-align:center;">No Properties</div>';
    let employmentHTML = '<div style="color: #fff; text-align:center;">Unemployed</div>';

    // convert key value pair object of licenses to array
    let licenses = Object.entries(profileResult.licences);

    if (licenses.length == 0 || licenses.length == undefined) {
      var licenseTypes = ['pilot', 'weapon1', 'weapon2', 'weapon3', 'driver', 'hunting'];
      licenses = Object.entries(licenseTypes.reduce((licenseType, licenseValue) => (licenseType[licenseValue] = false, licenseType), {}));
    }

    if (licenses.length > 0 && (PoliceJobs[playerJob] !== undefined || DojJobs[playerJob] !== undefined)) {
        licencesHTML = '';
        for (const [lic, hasLic] of licenses) {
          let licenseName = lic
          let tagColour = hasLic == true ? "green-tag" : "red-tag";
          if (lic == 'weapon1'){
            licenseName = 'Weapon License';
          }
          if (lic == 'weapon2'){
            licenseName = 'Class 2 Weapon License';
          }
          if (lic == 'weapon3'){
            licenseName = 'Class 3 Weapon License';
          }
          if (lic == 'permit'){
            licenseName = 'Learners License';
          }
          if (lic == 'hunting'){
            licenseName = 'Hunting License';
          }
          if (lic == 'driver'){
            licenseName = 'Driving License';
          }
          if (lic == 'Pilot'){
            licenseName = 'Pilots License';
          }
          licencesHTML += `<span class="license-tag ${tagColour} ${lic}" data-type="${lic}">${titleCase(licenseName)}</span>`;
        }
    }

    // if (properties && properties.length > 0) {
      employmentHTML = '';
      //   properties.forEach(value => {
           employmentHTML += `<div class="white-tag">${profileResult.job} | ${profileResult.grade}</div>`;
        // })
     //  }

    if (properties && properties.length > 0) {
      propertyHTML = '';
      properties.forEach(value => {
        propertyHTML += `<div class="white-tag" data-location="${value.coords}">${value.label} </div>`;
      })
    }

    if (vehicles && vehicles.length > 0) {

      vehHTML = '';
      vehicles.forEach(value => {
        vehHTML += `<div class="veh-tag" data-plate="${value.plate}">${value.plate} - ${value.model} </div>`
      })
    }

    if (convictions && convictions.length > 0) {
      convHTML = '';
      convictions.forEach(value => {
        convHTML += `<div class="white-tag">${value} </div>`;
      })
    }
    if (tags && tags.length > 0) {
      tagsHTML = '';
      tags.forEach((tag) => {
        tagsHTML += `<div class="tag">${tag}</div>`;
      })
    }

    if (gallery && gallery.length > 0) {
      galleryHTML = '';
      gallery.forEach(value => {
        galleryHTML += `<img src="${value}" class="gallery-img" onerror="this.src='img/not-found.jpg'">`;
      })
    }

    if (PoliceJobs[playerJob] === undefined && DojJobs[playerJob] === undefined){
      licencesHTML = '<div style="color: #fff; text-align:center;"Hidden</div>';
      tagsHTML = '<div style="color: #fff; text-align:center;">Hidden</div>';
    }

    if (profileResult.isLimited) {
      $(".manage-profile-vehs-container").fadeOut(250);
      $(".manage-profile-houses-container").fadeOut(250);
      $(".manage-profile-houses-container").fadeOut(250);
    } else {
      $(".manage-profile-vehs-container").fadeIn(250);
      $(".manage-profile-houses-container").fadeIn(250);
      $(".manage-profile-houses-container").fadeIn(250);
    }

    $(".licenses-holder").html(licencesHTML);
    $(".convictions-holder").html(convHTML);
    $(".vehs-holder").html(vehHTML);
    $(".gallery-inner-container").html(galleryHTML);
    $(".houses-holder").html(propertyHTML);
    $(".manage-groups-tags-holder").html(tagsHTML);
    $(".employment-holder").html(employmentHTML);
  }
  function displayReport(id){
    if (currentTab != ".reports-page-container") {
      fidgetSpinner(".reports-page-container");
      currentTab = ".reports-page-container";
    }

    if ($(".manage-reports-tags-add-btn").hasClass("fa-minus")) {
      $(".manage-reports-tags-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }
    if ($(".reports-gallery-add-btn").hasClass("fa-minus")) {
      $(".reports-gallery-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }
    if ($(".reports-officers-add-btn").hasClass("fa-minus")) {
      $(".reports-officers-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }

    if ($(".reports-gallery-upload-input").css("display") == "block") {
      $(".reports-gallery-upload-input").slideUp(250);
      setTimeout(() => {
        $(".reports-gallery-upload-input").css("display", "none");
      }, 250);
    }

    canInputTag = true;
    canInputReportTag = true;
    canInputReportOfficerTag = true;
    $.post(
      `https://${GetParentResourceName()}/getReportData`,
      JSON.stringify({
        id: id,
      })
    );
  }
  function displayWeaponReg(serialnumber){
    if (currentTab != ".weaponreg-page-container") {
      fidgetSpinner(".weaponreg-page-container");
      currentTab = ".weaponreg-page-container";
    }

    if ($(".weaponreg-timeline-persons-add-btn").hasClass("fa-minus")) {
      $(".weaponreg-timeline-persons-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }

    $.post(
      `https://${GetParentResourceName()}/getWeaponData`,
      JSON.stringify({
        serialNum: serialnumber,
      })
    );
  }
  function displayWeaponRegEvent(id){
    if (currentTab != ".weaponreg-page-container") {
      fidgetSpinner(".weaponreg-page-container");
      currentTab = ".weaponreg-page-container";
    }

    if ($(".weaponreg-timeline-persons-add-btn").hasClass("fa-minus")) {
      $(".weaponreg-timeline-persons-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }

    $.post(
      `https://${GetParentResourceName()}/getWeaponEvent`,
      JSON.stringify({
        id: id,
      })
    );
  }


  function displayBolos(id){
    if ($(".manage-bolos-tags-add-btn").hasClass("fa-minus")) {
      $(".manage-bolos-tags-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }
    if ($(".bolo-gallery-add-btn").hasClass("fa-minus")) {
      $(".bolo-gallery-add-btn")
        .removeClass("fa-minus")
        .addClass("fa-plus");
    }
    if ($(".officers-add-btn").hasClass("fa-minus")) {
      $(".officers-add-btn").removeClass("fa-minus").addClass("fa-plus");
    }

    if ($(".bolo-gallery-upload-input").css("display") == "block") {
      $(".bolo-gallery-upload-input").slideUp(250);
      setTimeout(() => {
        $(".bolo-gallery-upload-input").css("display", "none");
      }, 250);
    }

    canInputTag = true;
    canInputBoloTag = true;
    canInputBoloOfficerTag = true;
    $.post(
      `https://${GetParentResourceName()}/getBoloData`,
      JSON.stringify({
        id: id,
      })
    );
  }

  function displayWarrant(id){
    if (currentTab != ".doj-page-container") {
      fidgetSpinner(".doj-page-container");
      currentTab = ".doj-page-container";
    }
    $.post(
      `https://${GetParentResourceName()}/getWarrantData`,
      JSON.stringify({
        warrantId: id,
      })
    );
    $(".doj-warrants-info-container").show();
  }


$(document).ready(() => {

  $(".dispatch-comms-refresh").empty();
    $(".dispatch-comms-refresh").prepend(
      `<span class="fas fa-spinner fa-spin"></span>`
    );
    setTimeout(() => {
      $(".dispatch-comms-refresh").empty();
      $(".dispatch-comms-refresh").html("Refresh");
      canRefreshReports = true;
      $.post(`https://${GetParentResourceName()}/refreshDispatchMsgs`, JSON.stringify({}));
    }, 1500);


  $(".header").hover(
    function () {
      $(".close-all").css("opacity", "0.5");
    },
    function () {
      $(".close-all").css("opacity", "1");
    }
  );
  $(".incidents-charges-title-container").hover(
    function () {
      $(".incidents-charges-table-container").css("opacity", "0.1");
      $(".close-all").css("filter", "none");
    },
    function () {
      $(".close-all").css("filter", "brightness(30%)");
      $(".incidents-charges-table-container").css("opacity", "1");
    }
  );
  $(".nav-item").click(function () {
    if ($(this).hasClass("active-nav") == false) {
      fidgetSpinner($(this).data("page"));
      currentTab = $(this).data("page");
    }
  });

  $(".profile-items").on("click", ".profile-item",  async function(){ 
    recentSearchedID = $(this).data("id"); 
    displayProfileData(recentSearchedID); 
  });
  $(".doj-warrants-list").on("click", ".doj-warrants-item",  async function(){ 
    recentSearchedWarrant = $(this).data("id"); 
    displayWarrant(recentSearchedWarrant); 
  });
  
  
  $('.tab-instances').on('click', '.tab-instance', async function(){
    var tabData = $(this).data("tabdata").split(',')[0];
    if (tabData==null){return;}

    currentTab = tabData;

    var additionalData = $(this).data("tabdata").split(',')[1];
    
    var type = currentTab.split('-')[0].replace('.', '');
    if(type=='profile'){
      storedID = additionalData;
      displayProfileData(storedID);
    }
    if(type=='incidents'){
      $.post(
        `https://${GetParentResourceName()}/getIncidentData`,
        JSON.stringify({
          id: additionalData,
        })
      );
    }
    if(type=='reports'){
      displayReport(additionalData);
    }
    if(type=='weaponreg'){
      displayWeaponReg(additionalData);
    }
    if(type=='bolos'){
      displayBolos(additionalData);
    }
    if(type=='dmv'){
      $.post(
        `https://${GetParentResourceName()}/getVehicleData`,
        JSON.stringify({
          plate: additionalData,
        })
      );
    }
    
    
    fidgetSpinner(currentTab);

  });

  $(".createMDTTab").click(function(){
    var title = currentTab.split('-')[0].replace('.', '');
    var additionalData = null;
    if(title=='profile'){
      additionalData = recentSearchedID;
      title = recentSearchedID;
    }
    if(title=='incidents'){
      additionalData = recentSearchedIncidentID;
      title = "Incident " + recentSearchedIncidentID;
    }
    if(title=='reports'){
      additionalData = recentSearchedReportID;
      title= "Report " + recentSearchedReportID;
    }
    if(title=='weaponreg'){
      additionalData = recentSearchedWeaponreg;
      title= recentSearchedWeaponreg;
    }
    if(title=='bolos'){
      additionalData = recentSearchedBoloID;
      title= "Bolo " + recentSearchedBoloID;
    }
    if(title=='dmv'){
      additionalData = recentSearchedDMVPlate;
      title= "V: " + recentSearchedDMVPlate;
    }
    if(title=="doj"){
      additionalData = recentSearchedWarrant;
      title= "V: " + recentSearchedWarrant;
    }
    if(additionalData==-1){ return; }
    var element = '<div data-id="' + additionalData + '" data-tabdata="' + currentTab + ',' + additionalData + '" class="tab-instance"><p style="overflow:visible; margin-bottom:10vh;">'+ title + '</p> </div>';
    $(".tab-instances").append(element);
  });
  
  $(".tab-instances").on(
    "contextmenu",
    ".tab-instance",
    function (e) {
      let args = [
        {
          className: "delete-tab-instance",
          icon: "fas fa-times",
          text: "Delete Tab",
          info:  $(this).data("id"),
        },
       
      ];
      openContextMenu(e, args);
    }
  );

  $(".contextmenu").on("click", ".delete-tab-instance", function () {

    let id = $(this).data("info");
    $(".tab-instances")
      .find("[data-id='" + id + "']")
      .remove();

    onMouseDown();
  });
  


  // <div class="bulletin-id">ID: ${BulletinId}</div>




  $(".newwarrants-searchperson-tags-add-btn").on("click", "", function () {
    document.addEventListener("mouseup", onMouseDownIcidents);
    $(".newwarrants-person-search-container").fadeIn(250);
    $(".close-all").css("filter", "brightness(15%)");
  });

  $(".associated-incidents-tags-add-btn").on("click", "", function () {
    document.addEventListener("mouseup", onMouseDownIcidents);
    $(".icidents-person-search-container").fadeIn(250);
    $(".close-all").css("filter", "brightness(15%)");
  });
  $(".gallery-add-btn").click(function () {
    if ($(".manage-profile-citizenid-input").val()) {
      if ($(".gallery-upload-input").css("display") == "none") {
        $(".gallery-upload-input").slideDown(250);
        $(".gallery-upload-input").css("display", "block");
        $(this).removeClass("fa-plus").addClass("fa-minus");
      } else {
        $(".gallery-upload-input").slideUp(250);
        setTimeout(() => {
          $(".gallery-upload-input").css("display", "none");
        }, 250);
        $(this).removeClass("fa-minus").addClass("fa-plus");
      }
    } else {
      $(this).effect("shake", { times: 2, distance: 2 }, 500);
    }
  });
  $("#gallery-upload-input").keydown(function (e) {
    if (e.keyCode === 13) {
      let URL = $("#gallery-upload-input").val();
      let cid = $(".manage-profile-citizenid-input").val();
      if (URL !== "") {
        let randomNum = Math.ceil(Math.random() * 10).toString();
        $(".gallery-inner-container").prepend(
          `<img src="${URL}" class="gallery-img ${randomNum}" onerror="this.src='img/not-found.jpg'">`
        );
        $("#gallery-upload-input").val("");
        $(".gallery-upload-input").slideUp(250);
        setTimeout(() => {
          $(".gallery-upload-input").css("display", "none");
        }, 250);
        $(".gallery-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
    }
  });
  $(".manage-profile-save").click(function () {
    if (canSaveProfile == true) {
      canSaveProfile = false;
      $(".manage-profile-save").empty();
      $(".manage-profile-save").prepend(
        `<span class="fas fa-check"></span>`
      );
      setTimeout(() => {
        $(".manage-profile-save").empty();
        $(".manage-profile-save").html("Save");
        canSaveProfile = true;
      }, 750);

      setTimeout(() => {
        let tags = new Array();
        let gallery = new Array();
        let licenses = {};

        $(".manage-groups-tags-holder")
          .find("div")
          .each(function () {
            if ($(this).text() != "" && $(this).text() != "No Affiliated Groups") {
              tags.push($(this).text());
            }
        });

        $(".gallery-inner-container")
        .find("img")
        .each(function () {
          if ($(this).attr("src") != "") {
            gallery.push($(this).attr("src"));
          }
        });

        let pfp = $(".manage-profile-pic").attr("src");
        let newpfp = $(".manage-profile-url-input").val();
        if (newpfp.includes("base64")) {
          newpfp = "img/not-found.jpg";
        } else {
          pfp = newpfp;
        }
        let description = $(".manage-profile-info").val();
        let id = $(".manage-profile-citizenid-input").val();

        $(".licenses-holder")
        .find("span")
        .each(function(){
          let type = $(this).data("type")
          if ($(this).attr('class').includes('green-tag')){
            licenses[type] = true;
          }
          else{
            licenses[type] = false;
          }
        })

        const fName = $(".manage-profile-name-input-1").val();
        const sName = $(".manage-profile-name-input-2").val();

        $.post(
          `https://${GetParentResourceName()}/saveProfile`,
          JSON.stringify({
            pfp: pfp,
            description: description,
            id: id,
            fName: fName,
            sName: sName,
            tags: tags,
            gallery: gallery,
            licenses: licenses
          })
        );
        $(".manage-profile-pic").attr("src", newpfp);
      }, 250);
    }
  });
  $(".manage-incidents-title-holder").on(
    "click",
    ".manage-incidents-save",
    function () {
      if (canSaveProfile == true) {
        canSaveProfile = false;
        $(".manage-incidents-save").empty();
        $(".manage-incidents-save").prepend(
          `<span class="fas fa-check style="margin-top: 3.5px;""></span>`
        );
        setTimeout(() => {
          $(".manage-incidents-save").empty();
          $(".manage-incidents-save").prepend(
            `<span class="fas fa-save" style="margin-top: 3.5px;"></span>`
          );
          canSaveProfile = true;
        }, 750);

        // Title, information, tags, officers involved, civs involved, evidence
        const title = $("#manage-incidents-title-input").val();
        const information = $(
          ".manage-incidents-reports-content"
        ).val();
        const dbid = $(".manage-incidents-editing-title").data("id");

        let tags = new Array();
        let officers = new Array();
        let civilians = new Array();
        let evidence = new Array();

        $(".manage-incidents-tags-holder")
          .find("div")
          .each(function () {
            if ($(this).text() != "") {
              tags.push($(this).text());
            }
          });

        $(".manage-incidents-officers-holder")
          .find("div")
          .each(function () {
            if ($(this).text() != "") {
              officers.push($(this).text());
            }
          });

        $(".manage-incidents-civilians-holder")
          .find("div")
          .each(function () {
            if ($(this).text() != "") {
              civilians.push($(this).text());
            }
          });

        $(".manage-incidents-evidence-holder")
          .find("img")
          .each(function () {
            if ($(this).attr("src") != "") {
              evidence.push($(this).attr("src"));
            }
          });

        let time = new Date();

        let associated = new Array();

        $(".associated-incidents-user-container").each(function (
          index
        ) {
          var cid = $(this).data("id");
          var guilty = false;
          var processed = false;
          var isassociated = false;
          var probation = false;
          var charges = new Array();

          $(".associated-incidents-user-tags-holder")
            .children("div")
            .each(function (index) {
              if ($(this).data("id") == cid) {
                if ($(this).hasClass("green-tag")) {
                  if ($(this).text() == "Guilty") {
                    guilty = true;
                  }
                  if ($(this).text() == "Processed") {
                    processed = true;
                  }
                  if ($(this).text() == "Associated") {
                    isassociated = true;
                  }
                  if ($(this).text() == "Probation") {
                    probation = true;
                  }
                }
              }
            });

          $(".associated-incidents-user-holder")
            .children("div")
            .each(function (index) {
              if (
                  ( $(".associated-incidents-user-holder")
                    .children()
                    .eq(index)
                    .data("id") == cid )
              ) {
                charges.push(
                  $(".associated-incidents-user-holder")
                    .children()
                    .eq(index)
                    .html()
                );
              }
            });

          associated.push({
            Cid: $(this).data("id"),
            Probation: probation,
            Guilty: guilty,
            Processed: processed,
            Isassociated: isassociated,
            Charges: charges,
            Fine: $(".fine-amount")
              .filter("[data-id='" + $(this).data("id") + "']")
              .val(),
            Sentence: $(".sentence-amount")
              .filter("[data-id='" + $(this).data("id") + "']")
              .val(),
            recfine: $(".fine-recommended-amount")
              .filter("[data-id='" + $(this).data("id") + "']")
              .val(),
            recsentence: $(".sentence-recommended-amount")
              .filter("[data-id='" + $(this).data("id") + "']")
              .val(),
          });
        });

        $.post(
          `https://${GetParentResourceName()}/saveIncident`,
          JSON.stringify({
            ID: dbid,
            title: title,
            information: information,
            tags: tags,
            officers: officers,
            civilians: civilians,
            evidence: evidence,
            associated: associated,
            time: time.getTime(),
          })
        );

        setTimeout(() => {
          if (canRefreshIncidents == true) {
            canRefreshIncidents = false;
            $(".incidents-search-refresh").empty();
            $(".incidents-search-refresh").prepend(
              `<span class="fas fa-spinner fa-spin"></span>`
            );
            setTimeout(() => {
              $(".incidents-search-refresh").empty();
              $(".incidents-search-refresh").html("Refresh");
              canRefreshIncidents = true;
              $.post(
                `https://${GetParentResourceName()}/getAllIncidents`,
                JSON.stringify({})
              );
            }, 1500);
          }
        }, 1000);
      }
    }
  );
  $(".manage-incidents-title-holder").on(
    "click",
    ".manage-incidents-create",
    function () {
      let tempalte =
        "📝 Summary:\n\n[Insert Report Summary Here]\n\n Weapons/Items Confiscated:\n\n· [Insert List Here]\n";
      $("#manage-incidents-title-input").val(
        "Name - Charge - " + $(".date").html()
      );
      $(".manage-incidents-reports-content").val(tempalte);

      $(".manage-incidents-tags-holder").empty();
      $(".manage-incidents-officers-holder").empty();
      $(".manage-incidents-civilians-holder").empty();
      $(".manage-incidents-evidence-holder").empty();
      $(".manage-incidents-title-holder").empty();
      $(".manage-incidents-title-holder").prepend(
        `
            <div class="manage-incidents-title">Manage Incident</div>
            <div class="manage-incidents-create"> <span class="fas fa-plus" style="margin-top: 3.5px;"></span></div>
            <div class="manage-incidents-save"><span class="fas fa-save" style="margin-top: 3.5px;"></span></div>
            `
      );
      $(".manage-incidents-title").css("width", "66%");
      $(".manage-incidents-create").css("margin-right", "0px");

      $(".incidents-ghost-holder").html("");
      $(".associated-incidents-tags-holder").html("");

      $(".manage-incidents-editing-title").html(
        "You are currently creating a new Incident"
      );
      $(".manage-incidents-editing-title").data("id", 0);

      $(".manage-incidents-tags-add-btn").css("pointer-events", "auto");
      $(".manage-incidents-reports-content").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-officers-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-civilians-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-evidence-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".associated-incidents-tags-add-btn").css(
        "pointer-events",
        "auto"
      );
    }
  );
  $(".tags-add-btn").click(function () {
    if ($(".manage-profile-citizenid-input").val()) {
      if (canInputTag) {
        $(this).removeClass("fa-plus").addClass("fa-minus");
        $(".tags-holder").prepend(
          `<span contenteditable="true" class="tag-input"></span>`
        );
        canInputTag = false;
      } else if (!canInputTag) {
        $(this).removeClass("fa-minus").addClass("fa-plus");
        $(".tag-input").remove();
        canInputTag = true;
      }
    } else {
      $(this).effect("shake", { times: 2, distance: 2 }, 500);
    }
  });

  $(".tags-holder").on("keydown", ".tag-input", function (e) {
    if (e.keyCode === 13) {
      addTag($(".tag-input").text());
      if ($(".tags-add-btn").hasClass("fa-minus")) {
        $(".tags-add-btn").removeClass("fa-minus").addClass("fa-plus");
      }
      $(".tag-input").remove();
    }
  });
  $(".contextmenu").on("click", ".search-vehicle", function () {
    let plate = $(this).data("info");
    fidgetSpinner(".dmv-page-container");
    currentTab = ".dmv-page-container";
    setTimeout(() => {
      $(".dmv-search-input").slideDown(250);
      $(".dmv-search-input").css("display", "block");
      setTimeout(() => {
        $("#dmv-search-input:text").val(plate.toString());
        setTimeout(() => {
          var e = jQuery.Event("keydown");
          e.which = 13; // # Some key code value
          e.keyCode = 13
          $("#dmv-search-input").trigger(e);
        }, 250);
      }, 250);
    }, 250);
  });
  $(".vehs-holder").on("contextmenu", ".veh-tag", function (e) {
    let args = [
      {
        className: "search-vehicle",
        icon: "fas fa-car",
        text: "Search Vehicle",
        info: $(this).data("plate"),
        status: "",
      },
    ];
    openContextMenu(e, args);
  });

  $(".contextmenu").on("click", ".make-waypoint", function () {
    let coord = $(this).data("info").split("===")
    setTimeout(() => {
      $.post(
        `https://${GetParentResourceName()}/SetHouseLocation`,
        JSON.stringify({
          coord: coord,
        })
      );
    }, 250);
  });
  $(".houses-holder").on("contextmenu", ".white-tag", function (e) {
    let args = [
      {
        className: "make-waypoint",
        icon: "fas fa-map-pin",
        text: "Make Waypoint",
        info: $(this).data("location"),
        status: "",
      },
    ];
    openContextMenu(e, args);
  });
  $(".gallery-inner-container").on("click", ".gallery-img", function () {
    if ($(this).css("filter") == "none") {
      $(this).css("filter", "blur(5px)");
    } else {
      $(this).css("filter", "none");
    }
  });
  $(".contextmenu").on("click", ".expand-image", function () {
    expandImage($(this).data("info"));
  });
  $(".contextmenu").on("click", ".remove-image", function () {
    removeImage($(this).data("info"));
  });
  $(".contextmenu").on("click", ".remove-image-incident", function () {
    $(".manage-incidents-evidence-holder img")
      .filter("[src='" + $(this).data("info") + "']")
      .remove();
  });
  $(".gallery-inner-container").on(
    "contextmenu",
    ".gallery-img",
    function (e) {
      let args = [
        {
          className: "remove-image",
          icon: "fas fa-times",
          text: "Remove Image",
          info: $(this).attr("src"),
          status: "",
        },
        {
          className: "expand-image",
          icon: "fas fa-expand",
          text: "Expand Image",
          info: $(this).attr("src"),
          status: $(this).css("filter"),
        },
      ];
      openContextMenu(e, args);
    }
  );

  $(".licenses-holder").on("contextmenu", ".license-tag", function (e) {
    const status = $(this).data("type");
    let type = $(this).html();

    if (type == "Theory") {
      info = "theory";
    } else if (type == "Car") {
      info = "drive";
    } else if (type == "Bike") {
      info = "drive_bike";
    } else if (type == "Truck") {
      info = "drive_truck";
    } else if (type == "Hunting License") {
      info = "hunting";
    } else if (type == "Pilot") {
      info = "pilot";
    } else if (type == "Weapon License") {
      info = "weapon";
    } else {
      info = type;
    }

    if ($(this).hasClass("green-tag")) {
      openContextMenu(e, [
        {
          className: "revoke-licence",
          icon: "fas fa-times",
          text: "Revoke License",
          info: info,
          status: status,
        },
      ]);
    } else if ($(this).hasClass("red-tag")) {
      openContextMenu(e, [
        {
          className: "give-licence",
          icon: "fas fa-check",
          text: "Give License",
          info: info,
          status: status,
        },
      ]);
    }
  });

  $(".contextmenu").on("click", ".revoke-licence", function () {
    // $.post(
    //   `https://${GetParentResourceName()}/updateLicence`,
    //   JSON.stringify({
    //     cid: $(".manage-profile-citizenid-input").val(),
    //     type: $(this).data("status"),
    //     status: "revoke",
    //   })
    // );

    const Elem = $(this).data("status");
    $(".license-tag")
      .filter(`[data-type="${Elem}"]`)
      .removeClass("green-tag")
      .addClass("red-tag");

    onMouseDown();
  });

  $(".contextmenu").on("click", ".give-licence", function () {
    // $.post(
    //   `https://${GetParentResourceName()}/updateLicence`,
    //   JSON.stringify({
    //     cid: $(".manage-profile-citizenid-input").val(),
    //     type: $(this).data("status"),
    //     status: "give",
    //   })
    // );
    const type = $(this).data("info");
    if(type=="weapon"){
      let description = $(".manage-profile-info").val();
        description = description + "\Weapon License Authorized by " + MyName + " on " + date + " " + time + "\n";
        $(".manage-profile-info").val(description);
    }
    if(type=="hunting"){
      let description = $(".manage-profile-info").val();
        description = description + "\Hunting License Authorized by " + MyName + " on " + date + " " + time + "\n";
        $(".manage-profile-info").val(description);
    }

    const Elem = $(this).data("status");
    $(".license-tag")
      .filter(`[data-type="${Elem}"]`)
      .removeClass("red-tag")
      .addClass("green-tag");

    onMouseDown();
  });

  $(".doj-warrants-title").click(function () {
    if (canSearchForProfiles == true) {
      if ($(".warrants-search-input").css("display") == "none") {
        $(".warrants-search-input").slideDown(250);
        $(".warrants-search-input").css("display", "block");
      } else {
        $(".warrants-search-input").slideUp(250);
        setTimeout(() => {
          $(".warrants-search-input").css("display", "none");
        }, 250);
      }
    }
  });

  $(".profile-title").click(function () {
    if (canSearchForProfiles == true) {
      if ($(".profile-search-input").css("display") == "none") {
        $(".profile-search-input").slideDown(250);
        $(".profile-search-input").css("display", "block");
      } else {
        $(".profile-search-input").slideUp(250);
        setTimeout(() => {
          $(".profile-search-input").css("display", "none");
        }, 250);
      }
    }
  });

  $("#profile-search-input").keydown(async function (e) {
    if (e.keyCode === 13 && canSearchForProfiles == true) {
      let name = $("#profile-search-input").val();
      if (name != "") {
        canSearchForProfiles = false;
        $(".profile-items").empty();
        $(".profile-items").prepend(
          `<div class="profile-loader"></div>`
        );

        let result = await $.post(
          `https://${GetParentResourceName()}/searchProfiles`,
          JSON.stringify({
            name: name,
          })
        );

        searchProfilesResults(result);
      }
    }
  });

  $("#warrants-search-input").keydown(async function (e) {
    if (e.keyCode === 13 && canSearchForWarrants == true) {
      let warrantid = $("#warrants-search-input").val();
      if (warrantid != "") {
        canSearchForWarrants = false;
        $(".doj-warrants-list").empty();
        $(".doj-warrants-list").prepend(
          `<div class="profile-loader"></div>`
        );
          console.log("enter");
        let result = await $.post(
          `https://${GetParentResourceName()}/searchWarrants`,
          JSON.stringify({
            warrant: warrantid,
          })
        );

        searchWarrantResult(result);
      }
    }
  });

  $(".incidents-title").click(function () {
    if (canSearchForProfiles == true) {
      if ($(".incidents-search-input").css("display") == "none") {
        $(".incidents-search-input").slideDown(250);
        $(".incidents-search-input").css("display", "block");
      } else {
        $(".incidents-search-input").slideUp(250);
        setTimeout(() => {
          $(".incidents-search-input").css("display", "none");
        }, 250);
      }
    }
  });

  $("#incidents-search-input").keydown(function (e) {
    if (e.keyCode === 13 && canSearchForProfiles == true) {
      let incident = $("#incidents-search-input").val();
      if (incident !== "") {
        canSearchForProfiles = false;
        $.post(
          `https://${GetParentResourceName()}/searchIncidents`,
          JSON.stringify({
            incident: incident,
          })
        );
        $(".incidents-items").empty();
        $(".incidents-items").prepend(
          `<div class="profile-loader"></div>`
        );
      }
    }
  });

  $("#dispatchmsg").keydown(function (e) {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      const time = new Date();
      $.post(
        `https://${GetParentResourceName()}/dispatchMessage`,
        JSON.stringify({
          message: $(this).val(),
          time: time.getTime(),
        })
      );
      $(this).val("");
    }
  });

  $(".incidents-items").on("click", ".incidents-item", function () {
    const id = $(this).data("id");
    recentSearchedIncidentID = id;
    $.post(
      `https://${GetParentResourceName()}/getIncidentData`,
      JSON.stringify({
        id: id,
      })
    );
  });
  $(".manage-incidents-civilians-holder").on("click", ".manage-incidents-civilians", async function () {
      const name = $(this).text();
      fidgetSpinner(".profile-page-container");
      currentTab = ".profile-page-container";
      $(".profile-search-input").slideDown(250);
      $(".profile-search-input").css("display", "block");
      $("#profile-search-input:text").val(name);
      canSearchForProfiles = false;
      let result = await $.post(
        `https://${GetParentResourceName()}/searchProfiles`,
        JSON.stringify({
          name: name,
        })
      );

      searchProfilesResults(result);
    }
  );

  //FORMS TO CLOSE WITHIN MDT USING ESC
  document.onkeyup = function (data) {
    if (data.which == 27) {
      let shouldClose = true;

      if ($(".respond-calls-container").css("display") == "block") {
        shouldClose = false;
        $(".respond-calls-container").fadeOut(500);
        setTimeout(() => {
          $(".close-all").css("filter", "none");
        }, 250);
      }

      if ($(".gallery-image-enlarged").css("display") == "block") {
        shouldClose = false;
        $(".gallery-image-enlarged").fadeOut(150);
        $(".gallery-image-enlarged").css("display", "none");
        $(".close-all").css("filter", "none");
      }

      if ($(".incidents-image-enlarged").css("display") == "block") {
        shouldClose = false;
        $(".incidents-image-enlarged").fadeOut(150);
        $(".incidents-image-enlarged").css("display", "none");
      }

      if (
        $(".icidents-person-search-container").css("display") != "none"
      ) {
        shouldClose = false;
        $(".icidents-person-search-container").fadeOut(250);
        $(".close-all").css("filter", "none");
      }
      if (
        $(".newwarrants-person-search-container").css("display") != "none"
      ) {
        shouldClose = false;
        $(".newwarrants-person-search-container").fadeOut(250);
        $(".close-all").css("filter", "none");
      }


      if ($(".incidents-charges-table").css("display") != "none") {
        shouldClose = false;
        $(".incidents-charges-table").slideUp(500);
        $(".incidents-charges-table").fadeOut(500);
        setTimeout(() => {
          $(".close-all").css("filter", "none");
        }, 550);
      }

      if ($(".dispatch-attached-units").css("display") != "none") {
        shouldClose = false;
        $(".dispatch-attached-units").slideUp(500);
        $(".dispatch-attached-units").fadeOut(500);
        setTimeout(() => {
          $(".close-all").css("filter", "none");
        }, 550);
      }

      if ($(".impound-form").css("display") != "none") {
        shouldClose = false;
        $(".impound-form").slideUp(250);
        $(".impound-form").fadeOut(250);
        setTimeout(() => {
          $(".close-all").css("filter", "none");
        }, 550);
      }

      if (shouldClose == true) {
        $.post(`https://${GetParentResourceName()}/escape`, JSON.stringify({}));
      }
    }
  };
  $(".manage-incidents-tags-add-btn").click(function () {
    if ($(".tag-incident-input")[0]) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".tag-incident-input").remove();
    } else {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".manage-incidents-tags-holder").prepend(
        `<span contenteditable="true" class="tag-incident-input"></span>`
      );
    }
  });
  $(".manage-groups-tags-add-btn").click(function () {
    if ($(".tag-groups-input")[0]) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".tag-groups-input").remove();
    } else {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".manage-groups-tags-holder").prepend(
        `<span contenteditable="true" class="tag-groups-input"></span>`
      );
    }
  });

  $(".icidents-person-search-name-input").on("keydown", "", function (e) {
    if (e.keyCode === 13) {
      let name = $(".icidents-person-search-name-input").val();
      $.post(
        `https://${GetParentResourceName()}/incidentSearchPerson`,
        JSON.stringify({
          name: name,
        })
      );
    }
  });
   $(".newwarrants-person-search-name-input").on("keydown", "", function (e) {
      if (e.keyCode === 13) {
        let name = $(".newwarrants-person-search-name-input").val();
        $.post(
          `https://${GetParentResourceName()}/newwarrantSearchPerson`,
          JSON.stringify({
            name: name,
          })
        );
      }
  });
 
  $(".manage-incidents-tags-holder").on(
    "keydown",
    ".tag-incident-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".manage-incidents-tags-holder").prepend(
          `<div class="manage-incidents-tag tag">${$(
            ".tag-incident-input"
          ).text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".manage-incidents-tags-add-btn").hasClass("fa-minus")) {
          $(".manage-incidents-tags-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        $(".tag-incident-input").remove();
      }
    }
  );

  $(".manage-groups-tags-holder").on(
    "keydown",
    ".tag-groups-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".manage-groups-tags-holder").prepend(
          `<div class="manage-groups-tag tag">${$(
            ".tag-groups-input"
          ).text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".manage-groups-tags-add-btn").hasClass("fa-minus")) {
          $(".manage-groups-tags-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        $(".tag-groups-input").remove();
      }
    }
  );

  $(".manage-incidents-officers-add-btn").click(function () {
    if ($(".officers-incident-input")[0]) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".officers-incident-input").remove();
    } else {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".manage-incidents-officers-holder").prepend(
        `<span contenteditable="true" class="officers-incident-input"></span>`
      );
    }
  });

  $(".manage-incidents-officers-holder").on(
    "keydown",
    ".officers-incident-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".manage-incidents-officers-holder").prepend(
          `<div class="manage-incidents-officers">${$(
            ".officers-incident-input"
          ).text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if (
          $(".manage-incidents-officers-add-btn").hasClass("fa-minus")
        ) {
          $(".manage-incidents-officers-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        $(".officers-incident-input").remove();
      }
    }
  );

  $(".manage-incidents-civilians-add-btn").click(function () {
    if ($(".civilians-incident-input")[0]) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".civilians-incident-input").remove();
    } else {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".manage-incidents-civilians-holder").prepend(
        `<span contenteditable="true" class="civilians-incident-input"></span>`
      );
    }
  });

  $(".manage-incidents-civilians-holder").on(
    "keydown",
    ".civilians-incident-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".manage-incidents-civilians-holder").prepend(
          `<div class="manage-incidents-civilians">${$(
            ".civilians-incident-input"
          ).text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if (
          $(".manage-incidents-civilians-add-btn").hasClass(
            "fa-minus"
          )
        ) {
          $(".manage-incidents-civilians-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        $(".civilians-incident-input").remove();
      }
    }
  );

  $(".manage-incidents-evidence-add-btn").click(function () {
    if ($(".incidents-upload-input").css("display") == "none") {
      $(".incidents-upload-input").slideDown(250);
      $(".incidents-upload-input").css("display", "block");
      $(this).removeClass("fa-plus").addClass("fa-minus");
    } else {
      $(".incidents-upload-input").slideUp(250);
      setTimeout(() => {
        $(".incidents-upload-input").css("display", "none");
      }, 250);
      $(this).removeClass("fa-minus").addClass("fa-plus");
    }
  });

  $("#incidents-upload-input").keydown(function (e) {
    if (e.keyCode === 13) {
      let URL = $("#incidents-upload-input").val();
      let cid = $(".manage-profile-citizenid-input").val();
      if (URL !== "") {
        let randomNum = Math.ceil(Math.random() * 10).toString();
        $(".manage-incidents-evidence-holder").prepend(
          `<img src="${URL}" class="incidents-img ${randomNum}" onerror="this.src='img/not-found.jpg'">`
        );
        $("#incidents-upload-input").val("");
        $(".incidents-upload-input").slideUp(250);
        setTimeout(() => {
          $(".incidents-upload-input").css("display", "none");
        }, 250);
        $(".manage-incidents-evidence-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
    }
  });

  $(".manage-incidents-evidence-holder").on(
    "click",
    ".incidents-img",
    function () {
      if ($(this).css("filter") == "none") {
        $(this).css("filter", "blur(5px)");
      } else {
        $(this).css("filter", "none");
      }
    }
  );

  $(".weaponreg-search-title").click(function () {
    if (canSearchForProfiles == true) {
      if ($(".weaponreg-search-input").css("display") == "none") {
        $(".weaponreg-search-input").slideDown(250);
        $(".weaponreg-search-input").css("display", "block");
      } else {
        $(".weaponreg-search-input").slideUp(250);
        setTimeout(() => {
          $(".weaponreg-search-input").css("display", "none");
        }, 250);
      }
    }
  });

  $(".manage-bolos-title-holder").on(
    "click",
    ".manage-bolos-new",
    function () {
      //if ($(".manage-bolos-editing-title").html() == 'You are currently creating a new BOLO') {
      //$(".manage-bolos-new").effect("shake", { times: 2, distance: 2 }, 500)
      //} else {
      var template = "";
      if ($(".badge-logo").attr("src") == "img/ems_badge.png") {
        template =
          "ICU Room #: [ # ]\n\nReport ID: [ Report ID ]\n\nTime Admitted: [ Date and Time Here ]\n\nSurgery: [Yes/No]\n\nInjuries/Ailments:\n - [ Enter List Of Injuries Here ]\n\n\nAdditional Attending:\n - [ List Any Other Staff Here ]\n\n\n🧑‍🤝‍🧑 Additonal Emergency Contacts:\n - [ Name And Number ]\n\n\nNotes:\n[Additional Notes Here]";
      }
      $(".manage-bolos-editing-title").html(
        "You are currently creating a new BOLO"
      );
      $(".manage-bolos-input-title").val("");
      $(".manage-bolos-input-plate").val("");
      $(".manage-bolos-input-owner").val("");
      $(".manage-bolos-input-individual").val("");
      $(".manage-bolos-reports-content").val(template);
      $(".manage-bolos-tags-holder").empty();
      $(".bolo-gallery-inner-container").empty();
      $(".manage-officers-tags-holder").empty();

      if ($(".manage-bolos-tags-add-btn").hasClass("fa-minus")) {
        $(".manage-bolos-tags-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
      if ($(".bolo-gallery-add-btn").hasClass("fa-minus")) {
        $(".bolo-gallery-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
      if ($(".officers-add-btn").hasClass("fa-minus")) {
        $(".officers-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }

      if ($(".bolo-gallery-upload-input").css("display") == "block") {
        $(".bolo-gallery-upload-input").slideUp(250);
        setTimeout(() => {
          $(".bolo-gallery-upload-input").css("display", "none");
        }, 250);
      }

      canInputTag = true;
      canInputBoloTag = true;
      canInputBoloOfficerTag = true;

      $(".tag-bolo-input").remove();
      canInputBoloTag = true;

      //}
    }
  );

  $(".manage-bolos-title-holder").on(
    "click",
    ".manage-bolos-save",
    function () {
      let existing = !(
        $(".manage-bolos-editing-title").html() ==
        "You are currently creating a new BOLO"
      );
      let id = $(".manage-bolos-editing-title").data("id");
      let title = $("#bolotitle").val();
      let plate = $("#boloplate").val();
      let owner = $("#boloowner").val();
      let individual = $("#boloindividual").val();
      let detail = $("#bolodetail").val();

      let tags = new Array();
      let gallery = new Array();
      let officers = new Array();

      $(".manage-bolos-tags-holder").each(function (index) {
        if ($(this).text() != "") {
          tags.push($(this).text());
        }
      });

      $(".bolo-gallery-inner-container").each(function (index) {
        if ($(this).text() != "") {
          gallery.push($(this).text());
        }
      });

      $(".manage-officers-tags-holder").each(function (index) {
        if ($(this).text() != "") {
          officers.push($(this).text());
        }
      });

      let time = new Date();

      $.post(
        `https://${GetParentResourceName()}/newBolo`,
        JSON.stringify({
          existing: existing,
          id: id,
          title: title,
          plate: plate,
          owner: owner,
          individual: individual,
          detail: detail,
          tags: tags,
          gallery: gallery,
          officers: officers,
          time: time.getTime(),
        })
      );
    }
  );

  $(".manage-incidents-evidence-holder").on(
    "contextmenu",
    ".incidents-img",
    function (e) {
      let args = [
        {
          className: "remove-image-incident",
          icon: "fas fa-times",
          text: "Remove Image",
          info: $(this).attr("src"),
          status: "",
        },
        {
          className: "expand-image",
          icon: "fas fa-expand",
          text: "Expand Image",
          info: $(this).attr("src"),
          status: $(this).css("filter"),
        },
      ];
      openContextMenu(e, args);
    }
  );

  $(".bolos-search-title").click(function () {
    if (canSearchForProfiles == true) {
      if ($(".bolos-search-input").css("display") == "none") {
        $(".bolos-search-input").slideDown(250);
        $(".bolos-search-input").css("display", "block");
      } else {
        $(".bolos-search-input").slideUp(250);
        setTimeout(() => {
          $(".bolos-search-input").css("display", "none");
        }, 250);
      }
    }
  });

  $("#bolos-search-input").keydown(function (e) {
    if (e.keyCode === 13 && canSearchForProfiles == true) {
      let searchVal = $("#bolos-search-input").val();
      if (searchVal !== "") {
        canSearchForProfiles = false;
        $.post(
          `https://${GetParentResourceName()}/searchBolos`,
          JSON.stringify({
            searchVal: searchVal,
          })
        );
        $(".bolos-items").empty();
        $(".bolos-items").prepend(`<div class="profile-loader"></div>`);
      }
    }
  });

  $(".bolos-search-refresh").click(function () {
    if (canRefreshBolo == true) {
      canRefreshBolo = false;
      $(".bolos-search-refresh").empty();
      $(".bolos-search-refresh").prepend(
        `<span class="fas fa-spinner fa-spin"></span>`
      );
      setTimeout(() => {
        $(".bolos-search-refresh").empty();
        $(".bolos-search-refresh").html("Refresh");
        canRefreshBolo = true;
        $.post(`https://${GetParentResourceName()}/getAllBolos`, JSON.stringify({}));
      }, 1500);
    }
  });

  $(".manage-bolos-tags-add-btn").click(function () {
    if (canInputBoloTag) {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".manage-bolos-tags-holder").prepend(
        `<span contenteditable="true" class="tag-bolo-input"></span>`
      );
      canInputBoloTag = false;
    } else if (!canInputBoloTag) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".tag-bolo-input").remove();
      canInputBoloTag = true;
    }
  });

  $(".manage-bolos-tags-holder").on(
    "keydown",
    ".tag-bolo-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".manage-bolos-tags-holder").prepend(
          `<div class="tag">${$(".tag-bolo-input").text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".manage-bolos-tags-add-btn").hasClass("fa-minus")) {
          $(".manage-bolos-tags-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        $(".tag-bolo-input").remove();
        canInputBoloTag = true;
      }
    }
  );

  $(".bolo-gallery-add-btn").click(function () {
    //if ($(".manage-profile-citizenid-input").val()) {
    if ($(".bolo-gallery-upload-input").css("display") == "none") {
      $(".bolo-gallery-upload-input").slideDown(250);
      $(".bolo-gallery-upload-input").css("display", "block");
      $(this).removeClass("fa-plus").addClass("fa-minus");
    } else {
      $(".bolo-gallery-upload-input").slideUp(250);
      setTimeout(() => {
        $(".bolo-gallery-upload-input").css("display", "none");
      }, 250);
      $(this).removeClass("fa-minus").addClass("fa-plus");
    }
    //} else {
    // $(this).effect("shake", { times: 2, distance: 2 }, 500)
    // }
  });

  $("#bolo-gallery-upload-input").keydown(function (e) {
    if (e.keyCode === 13) {
      let URL = $("#bolo-gallery-upload-input").val();
      let cid = $(".manage-profile-citizenid-input").val();
      if (URL !== "") {
        let randomNum = Math.ceil(Math.random() * 10).toString();
        $(".bolo-gallery-inner-container").prepend(
          `<img src="${URL}" class="bolo-img ${randomNum}" onerror="this.src='img/not-found.jpg'">`
        );
        $("#bolo-gallery-upload-input").val("");
        $(".bolo-gallery-upload-input").slideUp(250);
        setTimeout(() => {
          $(".bolo-gallery-upload-input").css("display", "none");
        }, 250);
        $(".bolo-gallery-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
    }
  });

  $(".bolos-items").on("click", ".bolo-item", function () {
    let id = $(this).data("id");
    recentSearchedBoloID = id;
    displayBolos(recentSearchedBoloID);
  });

  $(".contextmenu").on("click", ".bolo-delete", function () {
    if ($(this).data("info") != 0) {
      if ($(".badge-logo").attr("src") == "img/ems_badge.png") {
        $(".bolos-items")
          .find("[data-id='" + $(this).data("info") + "']")
          .remove();
        $.post(
          `https://${GetParentResourceName()}/deleteICU`,
          JSON.stringify({
            id: $(this).data("info"),
          })
        );
      }
      $(".bolos-items")
        .find("[data-id='" + $(this).data("info") + "']")
        .remove();
      $.post(
        `https://${GetParentResourceName()}/deleteBolo`,
        JSON.stringify({
          id: $(this).data("info"),
        })
      );
    }
  });

  $(".bolos-items").on("contextmenu", ".bolo-item", function (e) {
    var args = "";
    args = [
      {
        className: "bolo-delete",
        icon: "fas fa-times",
        text: "Delete Bolo",
        info: $(this).data("id"),
        status: "",
      },
    ];
    if ($(".badge-logo").attr("src") == "img/ems_badge.png") {
      args = [
        {
          className: "bolo-delete",
          icon: "fas fa-times",
          text: "Delete Check-In",
          info: $(this).data("id"),
          status: "",
        },
      ];
    }
    openContextMenu(e, args);
  });

 
  $(".incidents-ghost-holder").on("click", ".addCharge-btn", function () {
    let stupidasscid = $(this).data("id");
    $(".incidents-charges-table").slideDown(500);
    $(".incidents-charges-table").fadeIn(500);
    $("#current-charges-holder").data("cid", $(this).data("id"));
    $("#current-charges-holder").html("");
    $(".associated-incidents-user-holder")
      .children("div")
      .each(function (index) {
        if (
          $(".associated-incidents-user-holder")
            .children()
            .eq(index)
            .data("id") == stupidasscid
        ) {
          const randomNum = Math.ceil(
            Math.random() * 1000
          ).toString();
          $("#current-charges-holder").prepend(
            `<div class="current-charges-tag" data-link="${randomNum}">${$(
              ".associated-incidents-user-holder"
            )
              .children()
              .eq(index)
              .html()}</div>`
          );
        }
      });
      //$(`[data-name="${cid}"]`).prepend(`<div class="white-tag" data-link="${randomNum}"data-id="${cid}">${$(this).find(".offense-item-offense").html()}</div>`);
  
    setTimeout(() => {
      $(".close-all").css("filter", "brightness(30%)");
    }, 250);
    $.post(`https://${GetParentResourceName()}/getPenalCode`, JSON.stringify({}));
  });

  
  $(".manage-profile-container").on("click", ".expunge-btn", function () {
    let cid = $(this).data("cid");

    let localDate = new Date();
    const myTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    date = localDate.toLocaleDateString("en-US", {
      timeZone: myTimeZone,
    });
    time = localDate.toLocaleTimeString("en-US", {
      timeZone: myTimeZone,
    });
    
    let description = $(".manage-profile-info").val();
    description = description + "\nExpungement Authorized by " + MyName + " on " + date + " " + time + "\n";
    $(".manage-profile-info").val(description);
    
    if (canSaveProfile == true) {
      canSaveProfile = false;
      $(".manage-profile-save").empty();
      $(".manage-profile-save").prepend(
        `<span class="fas fa-check"></span>`
      );
      setTimeout(() => {
        $(".manage-profile-save").empty();
        $(".manage-profile-save").html("Save");
        canSaveProfile = true;
      }, 750);

      setTimeout(() => {
        let tags = new Array();
        let gallery = new Array();
        let licenses = {};

        $(".manage-groups-tags-holder")
          .find("div")
          .each(function () {
            if ($(this).text() != "" && $(this).text() != "No Affiliated Groups") {
              tags.push($(this).text());
            }
        });

        $(".gallery-inner-container")
        .find("img")
        .each(function () {
          if ($(this).attr("src") != "") {
            gallery.push($(this).attr("src"));
          }
        });

        let pfp = $(".manage-profile-pic").attr("src");
        let newpfp = $(".manage-profile-url-input").val();
        if (newpfp.includes("base64")) {
          newpfp = "img/not-found.jpg";
        } else {
          pfp = newpfp;
        }
        let description = $(".manage-profile-info").val();
        let id = $(".manage-profile-citizenid-input").val();

        $(".licenses-holder")
        .find("span")
        .each(function(){
          let type = $(this).data("type")
          if ($(this).attr('class').includes('green-tag')){
            licenses[type] = true;
          }
          else{
            licenses[type] = false;
          }
        })

        const fName = $(".manage-profile-name-input-1").val();
        const sName = $(".manage-profile-name-input-2").val();

        $.post(
          `https://${GetParentResourceName()}/saveProfile`,
          JSON.stringify({
            pfp: pfp,
            description: description,
            id: id,
            fName: fName,
            sName: sName,
            tags: tags,
            gallery: gallery,
            licenses: licenses
          })
        );
        $(".manage-profile-pic").attr("src", newpfp);
      }, 250);
    }

    $.post(`https://${GetParentResourceName()}/expungePerson`, JSON.stringify({
      cid:cid
    }));

  });


  
  $(".doj-lawyers-container").on("click", ".viewPenalCode-btn", function () {
    $(".incidents-charges-table").slideDown(500);
    $(".incidents-charges-table").fadeIn(500);
    $("#current-charges-holder").html("");

    setTimeout(() => {
      $(".close-all").css("filter", "brightness(30%)");
    }, 250);
    $.post(`https://${GetParentResourceName()}/getPenalCode`, JSON.stringify({}));
  });


  $(".incidents-ghost-holder").on("contextmenu", ".white-tag", function (e) {
    let args = [
      {
        className: "remove-charge",
        icon: "fas fa-times",
        text: "Remove Charge",
        info: $(this).data("link"),
        status: $(this).data("id"),
      },
    ];
    openContextMenu(e, args);
  });
  $(".contextmenu").on("click", ".remove-charge", function () {

   let id = $(this).data("info");
   let cid = $(this).data("status");

   const Fine = +$(".white-tag").filter(`[data-link="${id}"]`).data("fine"); // the fine associated with the charge
   const Time = +$(".white-tag").filter(`[data-link="${id}"]`).data("time"); // the fine associated with the charge
  
   $(".white-tag").filter(`[data-link="${id}"]`).remove();
   
   const CurrRfine = $(".fine-recommended-amount").filter("[data-id='" + cid + "']").val();
   const NewFine = +CurrRfine - Fine;
   $(".fine-recommended-amount").filter("[data-id='" + cid + "']").val(NewFine);
   const CurrRsentence = $(".sentence-recommended-amount").filter("[data-id='" + cid + "']").val();
   const NewSentence = +CurrRsentence - +Time;
   $(".sentence-recommended-amount").filter("[data-id='" + cid + "']").val(NewSentence);
   
  });


  var shiftPressed = false;
  $(document).keydown(function (event) {
    shiftPressed = event.keyCode == 16;
  });
  $(document).keyup(function (event) {
    if (event.keyCode == 16) {
      shiftPressed = false;
    }
  });

  $(".offenses-main-container").on("mousedown",".offense-item",function (e) {
      const cid = $("#current-charges-holder").data("cid");
      const newItem = $(this).find(".offense-item-offense").html();
      const Fine = +$(this).data("fine"); // the fine associated with the charge
      const Sentence = +$(this).data("sentence"); //the sentence associatd with the charge
      if (e.which == 1) {
        let randomNum = Math.ceil(Math.random() * 1000).toString();
        var newchargetag = `<div class="white-tag" data-link="${randomNum}" data-id="${cid}" data-fine="${Fine}" data-time="${Sentence}">${$(this).find(".offense-item-offense").html()}</div>`;
        $(`[data-name="${cid}"]`).prepend(newchargetag);
        $("#current-charges-holder").prepend(`<div class="current-charges-tag" data-link="${randomNum}">${$(this).find(".offense-item-offense").html()}</div>`);

        const CurrRfine = $(".fine-recommended-amount").filter("[data-id='" + cid + "']").val();
        const NewFine = +CurrRfine + +Fine;
        $(".fine-recommended-amount").filter("[data-id='" + cid + "']").val(NewFine);
        const CurrRsentence = $(".sentence-recommended-amount").filter("[data-id='" + cid + "']").val();
        const NewSentence = +CurrRsentence + +Sentence;
        $(".sentence-recommended-amount").filter("[data-id='" + cid + "']").val(NewSentence);
      } else if (e.which == 3) {
        $(".associated-incidents-user-holder").children("div").each(function (index) {
          if ($(".associated-incidents-user-holder").children().eq(index).data("id") == cid) {
            if ($(".associated-incidents-user-holder").children().eq(index).html() == newItem) {
              const linkedId = $(".associated-incidents-user-holder").children().eq(index).data("link");
              //$(".current-charges-tag").filter(`[data-link="${linkedId}"]`).remove()
              $(".white-tag").filter(`[data-link="${linkedId}"]`).remove();

              var stop = false;

              $("#current-charges-holder").children("div").each(function (index) {
                if (stop == false) {
                  if ($("#current-charges-holder").children().eq(index).html() == newItem) {
                    const linkedId = $("#current-charges-holder").children().eq(index).data("link");
                    $(".current-charges-tag").filter(`[data-link="${linkedId}"]`).remove();
                    stop = true;
                  }
                }
              });

              const CurrRfine = $(".fine-recommended-amount").filter("[data-id='" + cid + "']").val();
              const NewFine = +CurrRfine - Fine;
              $(".fine-recommended-amount").filter("[data-id='" + cid + "']").val(NewFine);
              const CurrRsentence = $(".sentence-recommended-amount").filter("[data-id='" + cid + "']").val();
              const NewSentence = +CurrRsentence - +Sentence;
              $(".sentence-recommended-amount").filter("[data-id='" + cid + "']").val(NewSentence);
              return false;
            }
          }
        });
      }
    }
  );

  $(".bolo-gallery-inner-container").on("click", ".bolo-img", function () {
    if ($(this).css("filter") == "none") {
      $(this).css("filter", "blur(5px)");
    } else {
      $(this).css("filter", "none");
    }
  });
  $(".contextmenu").on("click", ".bolo-remove-image", function () {
    $(".bolo-gallery-inner-container img")
      .filter("[src='" + $(this).data("info") + "']")
      .remove();
  });
  $(".bolo-gallery-inner-container").on(
    "contextmenu",
    ".bolo-img",
    function (e) {
      let args = [
        {
          className: "bolo-remove-image",
          icon: "fas fa-times",
          text: "Remove Image",
          info: $(this).attr("src"),
          status: "",
        },
        {
          className: "expand-image",
          icon: "fas fa-expand",
          text: "Expand Image",
          info: $(this).attr("src"),
          status: $(this).css("filter"),
        },
      ];
      openContextMenu(e, args);
    }
  );

  $(".officers-add-btn").click(function () {
    if (canInputBoloOfficerTag) {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".manage-officers-tags-holder").prepend(
        `<span contenteditable="true" class="officer-tag-bolo-input"></span>`
      );
      canInputBoloOfficerTag = false;
    } else if (!canInputBoloOfficerTag) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".officer-tag-bolo-input").remove();
      canInputBoloOfficerTag = true;
    }
  });

  $(".manage-officers-tags-holder").on(
    "keydown",
    ".officer-tag-bolo-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".manage-officers-tags-holder").prepend(
          `<div class="tag">${$(
            ".officer-tag-bolo-input"
          ).text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".officers-add-btn").hasClass("fa-minus")) {
          canInputBoloOfficerTag = true;
          $(".officers-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        canInputBoloOfficerTag = true;
        $(".officer-tag-bolo-input").remove();
      }
    }
  );
  $(".incidents-ghost-holder").on(
    "click",
    ".associated-incidents-user-tag",
    function () {
      if ($(this).hasClass("red-tag")) {
        $(this).removeClass("red-tag");
        $(this).addClass("green-tag");
        if ($(this).text() == "Associated") {
          $(".associated-incidents-user-holder")
            .filter(`[data-name="${$(this).data("id")}"]`)
            .css("display", "none");
          $(".associated-incidents-fine-input")
            .filter(`[data-id="${$(this).data("id")}"]`)
            .css("display", "none");
          $(".manage-incidents-title-tag")
            .filter(`[data-id="${$(this).data("id")}"]`)
            .css("display", "none");
          $(".associated-incidents-sentence-input")
            .filter(`[data-id="${$(this).data("id")}"]`)
            .css("display", "none");
        }
      } else {
        $(this).removeClass("green-tag");
        $(this).addClass("red-tag");
        if ($(this).text() == "Associated") {
          $(".associated-incidents-user-holder")
            .filter(`[data-name="${$(this).data("id")}"]`)
            .fadeIn(100);
          $(".associated-incidents-fine-input")
            .filter(`[data-id="${$(this).data("id")}"]`)
            .fadeIn(100);
          $(".manage-incidents-title-tag")
            .filter(`[data-id="${$(this).data("id")}"]`)
            .fadeIn(100);
          $(".associated-incidents-sentence-input")
            .filter(`[data-id="${$(this).data("id")}"]`)
            .fadeIn(100);
        }
      }
    }
  );
  $(".contextmenu").on(
    "click",
    ".associated-incidents-remove-tag",
    function () {
      $(
        `.associated-incidents-tag:contains(${$(this).data("info")})`
      ).remove();
      $(
        `.associated-incidents-user-title:contains(${$(this).data(
          "info"
        )})`
      )
        .parent()
        .remove();
      const incidentId = $(".manage-incidents-editing-title").data("id");
      if (incidentId != 0) {
        $.post(
          `https://${GetParentResourceName()}/removeIncidentCriminal`,
          JSON.stringify({
            cid: $(this).data("status"),
            incidentId: incidentId,
          })
        );
      }
    }
  );
  $(".associated-incidents-tags-holder").on(
    "contextmenu",
    ".associated-incidents-tag",
    function (e) {
      let args = [
        {
          className: "associated-incidents-remove-tag",
          icon: "fas fa-times",
          text: "Remove Tag",
          info: $(this).html(),
          status: $(this).data("id"),
        },
      ];
      openContextMenu(e, args);
    }
  );
  $(".icidents-person-search-holder").on(
    "click",
    ".icidents-person-search-item",
    function () {
      $(".icidents-person-search-container").fadeOut(250);
      $(".close-all").css("filter", "none");
      $(".associated-incidents-tags-holder").prepend(
        `<div class="associated-incidents-tag" data-id="${$(this).data(
          "id"
        )}">${$(this).data("name")}</div>`
      );

      $(".incidents-ghost-holder").prepend(
        `
            <div class="associated-incidents-user-container" data-id="${$(
          this
        ).data("cid")}">
                <div class="associated-incidents-user-title">${$(this).data(
          "info"
        )}</div>
                <div class="associated-incidents-user-tags-holder">
                  <div class="associated-incidents-user-tag red-tag" data-id="${$(this).data("cid")}">Probation</div>
                    <div class="associated-incidents-user-tag red-tag" data-id="${$(this).data("cid")}">Guilty</div>
                    <div class="associated-incidents-user-tag red-tag" data-id="${$(this).data("cid")}">Processed</div>
                    <div class="associated-incidents-user-tag red-tag" data-id="${$(this).data("cid")}">Associated</div>
                </div>
                <div class="associated-incidents-user-holder" data-name="${$(
          this
        ).data("cid")}">
                </div>  <div class="addCharge-btn" data-id="${$(this).data("cid")}">Add Charge</div>
                <div class="manage-incidents-title-tag" data-id="${$(this).data(
          "cid"
        )}">Recommended Fine</div>
                <div class="associated-incidents-fine-input" data-id="${$(
          this
        ).data(
          "cid"
        )}"><img src="https://i.imgur.com/h7S5f9J.png"> <input disabled placeholder="0" class="fine-recommended-amount" id="fine-recommended-amount" data-id="${$(
          this
        ).data("cid")}" type="number"></div>
                <div class="manage-incidents-title-tag" data-id="${$(this).data(
          "cid"
        )}">Recommended Sentence</div>
                <div class="associated-incidents-sentence-input" data-id="${$(
          this
        ).data(
          "cid"
        )}"><img src="https://i.imgur.com/9Xn6xXK.png"> <input disabled placeholder="0" class="sentence-recommended-amount" id="sentence-recommended-amount" data-id="${$(
          this
        ).data("cid")}" type="number"></div>
                <div class="manage-incidents-title-tag" data-id="${$(this).data(
          "cid"
        )}">Fine</div>
                <div class="associated-incidents-fine-input" data-id="${$(
          this
        ).data(
          "cid"
        )}"><img src="https://i.imgur.com/h7S5f9J.png"> <input placeholder="Enter fine here..." value="0" class="fine-amount" data-id="${$(
          this
        ).data("cid")}" type="number"></div>
                <div class="manage-incidents-title-tag" data-id="${$(this).data(
          "cid"
        )}">Sentence</div>
                <div class="associated-incidents-sentence-input" data-id="${$(
          this
        ).data(
          "cid"
        )}"><img src="https://i.imgur.com/9Xn6xXK.png"> <input placeholder="Enter months here..." value="0" class="sentence-amount" data-id="${$(
          this
        ).data("cid")}" type="number"></div>
            </div>
            `
      );
    }
  );

  $(".newwarrants-person-search-holder").on(
    "click",
    ".newwarrants-person-search-item",
    function () {
      $(".newwarrants-person-search-container").fadeOut(250);
      $(".close-all").css("filter", "none");
      $("#newwarrants-personname").html($(this).data("name") + " | " + $(this).data("cid"));
      $("#newwarrants-personname").data("cid", $(this).data("cid"));
    }
  );

  $(".contextmenu").on("click", ".incidents-remove-tag", function () {
    $(`.tag:contains(${$(this).data("info")})`).remove();
  });

  $(".manage-incidents-tags-holder").on("contextmenu", ".tag", function (e) {
    let args = [
      {
        className: "incidents-remove-tag",
        icon: "fas fa-times",
        text: "Remove Tag",
        info: $(this).html(),
        status: "",
      },
    ];
    openContextMenu(e, args);
  });

  
  $(".contextmenu").on("click", ".groups-remove-tag", function () {
    $(`.tag:contains(${$(this).data("info")})`).remove();
  });

  $(".manage-groups-tags-holder").on("contextmenu", ".tag", function (e) {
    let args = [
      {
        className: "groups-remove-tag",
        icon: "fas fa-times",
        text: "Remove Tag",
        info: $(this).html(),
        status: "",
      },
    ];
    openContextMenu(e, args);
  });

  $(".contextmenu").on("click", ".incidents-remove-officer-tag", function () {
    $(
      `.manage-incidents-officers:contains(${$(this).data("info")})`
    ).remove();
  });

  $(".manage-incidents-officers-holder").on(
    "contextmenu",
    ".manage-incidents-officers",
    function (e) {
      let args = [
        {
          className: "incidents-remove-officer-tag",
          icon: "fas fa-times",
          text: "Remove Tag",
          info: $(this).html(),
          status: "",
        },
      ];
      openContextMenu(e, args);
    }
  );

  $(".contextmenu").on("click", ".incidents-remove-civ-tag", function () {
    $(
      `.manage-incidents-civilians:contains(${$(this).data("info")})`
    ).remove();
  });

  $(".manage-incidents-civilians-holder").on(
    "contextmenu",
    ".manage-incidents-civilians",
    function (e) {
      let args = [
        {
          className: "incidents-remove-civ-tag",
          icon: "fas fa-times",
          text: "Remove Tag",
          info: $(this).html(),
          status: "",
        },
      ];
      openContextMenu(e, args);
    }
  );

  $(".doj-warrants-search-refresh").click(function () {
    if (canRefreshWarrants == true) {
      canRefreshWarrants = false;
      $(".doj-warrants-search-refresh").empty();
      $(".doj-warrants-search-refresh").prepend(
        `<span class="fas fa-spinner fa-spin"></span>`
      );
      setTimeout(() => {
        $(".doj-warrants-search-refresh").empty();
        $(".doj-warrants-search-refresh").html("Refresh");
        canRefreshWarrants = true;
        $.post(`https://${GetParentResourceName()}/getAllWarrants`, JSON.stringify({}));
      }, 1500);
    }
  });

  $(".incidents-search-refresh").click(function () {
    if (canRefreshIncidents == true) {
      canRefreshIncidents = false;
      $(".incidents-search-refresh").empty();
      $(".incidents-search-refresh").prepend(
        `<span class="fas fa-spinner fa-spin"></span>`
      );
      setTimeout(() => {
        $(".incidents-search-refresh").empty();
        $(".incidents-search-refresh").html("Refresh");
        canRefreshIncidents = true;
        $.post(`https://${GetParentResourceName()}/getAllIncidents`, JSON.stringify({}));
      }, 1500);
    }
  });

  $(".contextmenu").on("click", ".incidents-remove-normal-tag", function () {
    $(`.tag:contains(${$(this).data("info")})`).remove();
    let cid = $(".manage-profile-citizenid-input").val();
    if (cid) {
      $.post(
        `https://${GetParentResourceName()}/removeProfileTag`,
        JSON.stringify({
          cid: cid,
          text: $(this).data("info"),
        })
      );
    }
  });
  $(".tags-holder").on("contextmenu", ".tag", function (e) {
    let args = [
      {
        className: "incidents-remove-normal-tag",
        icon: "fas fa-times",
        text: "Remove Tag",
        info: $(this).html(),
        status: "",
      },
    ];
    openContextMenu(e, args);
  });

  $(".icidents-person-search-container").hover(
    function () {
      mouse_is_inside = true;
    },
    function () {
      mouse_is_inside = false;
    }
  );

  $(".dispatch-comms-refresh").click(function () {
    $(".dispatch-comms-refresh").empty();
    $(".dispatch-comms-refresh").prepend(
      `<span class="fas fa-spinner fa-spin"></span>`
    );
    setTimeout(() => {
      $(".dispatch-comms-refresh").empty();
      $(".dispatch-comms-refresh").html("Refresh");
      canRefreshReports = true;
      $.post(`https://${GetParentResourceName()}/refreshDispatchMsgs`, JSON.stringify({}));
    }, 1500);
  });




















  //----------------------------------REPORTS-------------------------------------------
  $(".reports-search-title").click(function () {
    if (canSearchReports == true) {
      if ($(".reports-search-input").css("display") == "none") {
        $(".reports-search-input").slideDown(250);
        $(".reports-search-input").css("display", "block");
      } else {
        $(".reports-search-input").slideUp(250);
        setTimeout(() => {
          $(".reports-search-input").css("display", "none");
        }, 250);
      }
    }
  });
  
  $(".reports-search-refresh").click(function () {
    if (canRefreshReports == true) {
      canRefreshReports = false;
      $(".reports-search-refresh").empty();
      $(".reports-search-refresh").prepend(
        `<span class="fas fa-spinner fa-spin"></span>`
      );
      setTimeout(() => {
        $(".reports-search-refresh").empty();
        $(".reports-search-refresh").html("Refresh");
        canRefreshReports = true;
        $.post(`https://${GetParentResourceName()}/getAllReports`, JSON.stringify({}));
      }, 1500);
    }
  });

  $(".reports-items").on("click", ".reports-item", function () {
    recentSearchedReportID = $(this).data("id");
    displayReport($(this).data("id"));
  });

  $(".manage-reports-tags-add-btn").click(function () {
    if (canInputReportTag) {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".manage-reports-tags-holder").prepend(
        `<span contenteditable="true" class="tag-reports-input"></span>`
      );
      canInputReportTag = false;
    } else if (!canInputReportTag) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".tag-reports-input").remove();
      canInputReportTag = true;
    }
  });

  $(".manage-reports-tags-holder").on(
    "keydown",
    ".tag-reports-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".manage-reports-tags-holder").prepend(
          `<div class="tag">${$(".tag-reports-input").text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".manage-reports-tags-add-btn").hasClass("fa-minus")) {
          $(".manage-reports-tags-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        $(".tag-reports-input").remove();
        canInputReportTag = true;
      }
    }
  );

  $(".reports-gallery-add-btn").click(function () {
    //if ($(".manage-profile-citizenid-input").val()) {
    if ($(".reports-gallery-upload-input").css("display") == "none") {
      $(".reports-gallery-upload-input").slideDown(250);
      $(".reports-gallery-upload-input").css("display", "block");
      $(this).removeClass("fa-plus").addClass("fa-minus");
    } else {
      $(".reports-gallery-upload-input").slideUp(250);
      setTimeout(() => {
        $(".reports-gallery-upload-input").css("display", "none");
      }, 250);
      $(this).removeClass("fa-minus").addClass("fa-plus");
    }
    //} else {
    // $(this).effect("shake", { times: 2, distance: 2 }, 500)
    // }
  });

  $("#reports-gallery-upload-input").keydown(function (e) {
    if (e.keyCode === 13) {
      let URL = $("#reports-gallery-upload-input").val();
      let cid = $(".manage-profile-citizenid-input").val();
      if (URL !== "") {
        let randomNum = Math.ceil(Math.random() * 10).toString();
        $(".reports-gallery-inner-container").prepend(
          `<img src="${URL}" class="reports-img ${randomNum}" onerror="this.src='img/not-found.jpg'">`
        );
        $("#reports-gallery-upload-input").val("");
        $(".reports-gallery-upload-input").slideUp(250);
        setTimeout(() => {
          $(".reports-gallery-upload-input").css("display", "none");
        }, 250);
        $(".reports-gallery-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
    }
  });

  $(".reports-gallery-inner-container").on(
    "click",
    ".reports-img",
    function () {
      if ($(this).css("filter") == "none") {
        $(this).css("filter", "blur(5px)");
      } else {
        $(this).css("filter", "none");
      }
    }
  );
  $(".contextmenu").on("click", ".reports-remove-image", function () {
    $(".reports-gallery-inner-container img")
      .filter("[src='" + $(this).data("info") + "']")
      .remove();
  });

  $(".reports-gallery-inner-container").on(
    "contextmenu",
    ".reports-img",
    function (e) {
      let args = [
        {
          className: "reports-remove-image",
          icon: "fas fa-times",
          text: "Remove Image",
          info: $(this).attr("src"),
          status: "",
        },
        {
          className: "expand-image",
          icon: "fas fa-expand",
          text: "Expand Image",
          info: $(this).attr("src"),
          status: $(this).css("filter"),
        },
      ];
      openContextMenu(e, args);
    }
  );

  $(".reports-officers-add-btn").click(function () {
    if (canInputReportOfficerTag) {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".reports-officers-tags-holder").prepend(
        `<span contenteditable="true" class="officer-tag-reports-input"></span>`
      );
      canInputReportOfficerTag = false;
    } else if (!canInputReportOfficerTag) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".officer-tag-reports-input").remove();
      canInputReportOfficerTag = true;
    }
  });

  $(".reports-officers-tags-holder").on(
    "keydown",
    ".officer-tag-reports-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".reports-officers-tags-holder").prepend(
          `<div class="tag">${$(
            ".officer-tag-reports-input"
          ).text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".reports-officers-add-btn").hasClass("fa-minus")) {
          canInputReportOfficerTag = true;
          $(".reports-officers-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        canInputReportOfficerTag = true;
        $(".officer-tag-reports-input").remove();
      }
    }
  );

  $(".reports-civilians-add-btn").click(function () {
    if (canInputReportCivilianTag) {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".reports-civilians-tags-holder").prepend(
        `<span contenteditable="true" class="civilian-tag-reports-input"></span>`
      );
      canInputReportCivilianTag = false;
    } else if (!canInputReportCivilianTag) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".civilian-tag-reports-input").remove();
      canInputReportCivilianTag = true;
    }
  });

  $(".reports-civilians-tags-holder").on(
    "keydown",
    ".civilian-tag-reports-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".reports-civilians-tags-holder").prepend(
          `<div class="tag">${$(
            ".civilian-tag-reports-input"
          ).text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".reports-civilians-add-btn").hasClass("fa-minus")) {
          canInputReportCivilianTag = true;
          $(".reports-civilians-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        canInputReportCivilianTag = true;
        $(".civilian-tag-reports-input").remove();
      }
    }
  );

  $(".manage-reports-title-holder").on(
    "click",
    ".manage-reports-new",
    function () {
      //if ($(".manage-bolos-editing-title").html() == 'You are currently creating a new BOLO') {
      //$(".manage-bolos-new").effect("shake", { times: 2, distance: 2 }, 500)
      //} else {
      let template = "";
      if ($(".badge-logo").attr("src") == "img/ems_badge.png") {
        template =
          "Submitted to ICU?: [Yes/No]\n\nIncident Report:\n[ Brief summary of what happened and who did what while on scene. Note anything that stood out about the scene as well as what was done to treat the patient ]\n\n\nList of Injuries:\n- [ State what injury or injuries occurred ]\n\n\n💉 Surgical Report:\n[ Full report on what was done in surgery, list any complications or anything that was found while in operation. Note who was attending and what they did during the surgery. At the end of the report be sure to note the state of the patient after ]\n\n\nAttending:\n- [ List Any Attending Here ]\n\n\nMedications Applied:\n- [ List Any Attending Here ]\n\n\nNotes:\n[ Additional Notes Here ]";
      }
      $(".manage-reports-editing-title").html(
        "You are currently creating a new report"
      );
      $(".manage-reports-input-title").val("");
      $(".manage-reports-input-type").val("");
      $(".manage-reports-reports-content").val(template);
      $(".manage-reports-tags-holder").empty();
      $(".reports-gallery-inner-container").empty();
      $(".reports-officers-tags-holder").empty();
      $(".reports-civilians-tags-holder").empty();

      if ($(".manage-reports-tags-add-btn").hasClass("fa-minus")) {
        $(".manage-reports-tags-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
      if ($(".reports-gallery-add-btn").hasClass("fa-minus")) {
        $(".reports-gallery-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }
      if ($(".officers-add-btn").hasClass("fa-minus")) {
        $(".officers-add-btn")
          .removeClass("fa-minus")
          .addClass("fa-plus");
      }

      if ($(".reports-gallery-upload-input").css("display") == "block") {
        $(".reports-gallery-upload-input").slideUp(250);
        setTimeout(() => {
          $(".reports-gallery-upload-input").css("display", "none");
        }, 250);
      }

      canInputTag = true;
      canInputReportTag = true;
      canInputReportOfficerTag = true;

      $(".tag-reports-input").remove();
      canInputReportTag = true;

      //}
    }
  );

  $("#reports-search-input").keydown(function (e) {
    if (e.keyCode === 13 && canSearchForReports == true) {
      let name = $(this).val();
      if (name !== "") {
        canSearchForReports = false;
        $.post(
          `https://${GetParentResourceName()}/searchReports`,
          JSON.stringify({
            name: name,
          })
        );
        $(".reports-items").empty();
        $(".reports-items").prepend(
          `<div class="profile-loader"></div>`
        );
      }
    }
  });

  $(".manage-reports-title-holder").on(
    "click",
    ".manage-reports-save",
    function () {
      let existing = !(
        $(".manage-reports-editing-title").html() ==
        "You are currently creating a new report"
      );
      let id = $(".manage-reports-editing-title").data("id");
      let title = $("#reporttitle").val();
      let type = $("#reporttype").val();
      let details = $("#reportdetail").val();
      let tags = new Array();
      let gallery = new Array();
      let officers = new Array();
      let civilians = new Array();

      $(".manage-reports-tags-holder")
        .find("div")
        .each(function () {
          if ($(this).text() != "") {
            tags.push($(this).text());
          }
        });

      $(".reports-gallery-inner-container")
        .find("img")
        .each(function () {
          if ($(this).attr("src") != "") {
            gallery.push($(this).attr("src"));
          }
        });

      $(".reports-officers-tags-holder")
        .find("div")
        .each(function () {
          if ($(this).text() != "") {
            officers.push($(this).text());
          }
        });

      $(".reports-civilians-tags-holder")
        .find("div")
        .each(function () {
          if ($(this).text() != "") {
            civilians.push($(this).text());
          }
        });

      let time = new Date();

      $.post(
        `https://${GetParentResourceName()}/newReport`,
        JSON.stringify({
          existing: existing,
          id: id,
          title: title,
          type: type,
          details: details,
          tags: tags,
          gallery: gallery,
          officers: officers,
          civilians: civilians,
          time: time.getTime(),
        })
      );
    }
  );
//-----------------------------------------------------------------------------













  //--------------------------WEAPON DATABASE------------------------------

  $(".weaponreg-search-refresh").click(function () {
    if (canRefreshReports == true) {
      canRefreshReports = false;
      $(".weaponreg-search-refresh").empty();
      $(".weaponreg-search-refresh").prepend(
        `<span class="fas fa-spinner fa-spin"></span>`
      );
      setTimeout(() => {
        $(".weaponreg-search-refresh").empty();
        $(".weaponreg-search-refresh").html("Refresh");
        canRefreshReports = true;
        $.post(`https://${GetParentResourceName()}/getAllWeapons`, JSON.stringify({}));
      }, 1500);
    }
  });

  $("#weaponreg-search-input").keydown(function (e) {
    if (e.keyCode === 13 && canSearchForWeaponReg == true) {
      let name = $(this).val();
      if (name !== "") {
        canSearchForWeaponReg = false;
        $.post(
          `https://${GetParentResourceName()}/searchWeapons`,
          JSON.stringify({
            name: name,
          })
        );
        $(".weaponreg-items").empty();
        $(".weaponreg-items").prepend(
          `<div class="profile-loader"></div>`
        );
      }
    }
  });

  $(".weaponreg-items").on("click", ".weaponreg-item", function () {
    recentSearchedWeaponreg = $(this).data("serialnumber");
    displayWeaponReg($(this).data("serialnumber"));
  });
  $(".weaponreg-timeline-content").on("click", ".weaponreg-timeline-event", function () {
    var weaponregEventID = $(this).data("id");
    currentSelectedWeaponEvent = weaponregEventID;
    if (weaponregEventID == -1){
      $('#weaponreg-timeline-right-event-title').val("New Event");

      $('#weaponreg-timeline-right-event-details').val("Fill event details here");

      $(".weaponreg-timeline-persons-tags-holder").empty();
    }
    else{
      displayWeaponRegEvent(weaponregEventID);
    }
    
  });

  
  
  $(".weaponreg-timeline-persons-add-btn").click(function () {
    if (canInputReportTag) {
      $(this).removeClass("fa-plus").addClass("fa-minus");
      $(".weaponreg-timeline-persons-tags-holder").prepend(
        `<span contenteditable="true" class="tag-weaponreg-input"></span>`
      );
      canInputReportTag = false;
    } else if (!canInputReportTag) {
      $(this).removeClass("fa-minus").addClass("fa-plus");
      $(".tag-weaponreg-input").remove();
      canInputReportTag = true;
    }
  });
  $("#weaponreg-timeline-event-addbtn").click(function () {
    //add a timeline event, locally save that data
    //then when we save timeline we loop through every locally saved added events and their data
    //and add them to the database
    currentSelectedWeaponEvent=-1;
    $('.weaponreg-timeline-content').append(
      `<div class="weaponreg-timeline-event" data-id="${-1}">
        <div class="weaponreg-timeline-event-type">
        ${"New Event"}</div>
        <div class="weaponreg-timeline-event-time">
         ${-1}</div></div>`
    );
    $('#weaponreg-timeline-right-event-title').val("New Event");

    $('#weaponreg-timeline-right-event-details').val("Fill event details here");

    $(".weaponreg-timeline-persons-tags-holder").empty();
  });

  $("#doj-warrants-createnew").click(function () {
    $(".doj-warrants-title").data("warrantid", -1);
    $('#newwarrants-personname').html("");
    $(".newwarrant-content").html("");
    
    $("#newwarrant-duration-input").val("00:24:00:00");
    var currentdate = new Date(); 
    var datetime = currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/" 
                    + currentdate.getFullYear() + "   "  
                    + currentdate.getHours() + ":"  
                    + currentdate.getMinutes();
    $(".doj-newwarrant-date").html(datetime)
    $(".doj-warrants-info-container").show();

    $("#doj-warrants-publishwarrant").show();
    $("#doj-warrants-publishwarrant").html("Publish Warrant");
    $(".doj-warrants-title").html("New Warrant");
  });

  
  $("#doj-warrants-publishwarrant").click(function () {
    let warrantId = $(".doj-warrants-title").data("warrantid");
    let personName =  $('#newwarrants-personname').html();

    let warrantDetails =  $('.newwarrant-content').html();

    let warrantDuration = $("#newwarrant-duration-input").val();

    let incidentNumber = $("#newwarrant-incident-input").val();
    let reportNumber = $("#newwarrant-report-input").val();


    let days = warrantDuration.split(":")[0];
    let hours = warrantDuration.split(":")[1];
    let minutes = warrantDuration.split(":")[2];

    
    let totalHoursDuration = Number(hours) + 24*Number(days);

    if(Number(minutes)>31){totalHoursDuration+=1;}
  $(".doj-warrants-info-container").hide();
    $.post(
      `https://${GetParentResourceName()}/newWarrant`,
      JSON.stringify({
        id: warrantId,
        personCID: personName.split(" | ")[1],
        warrantDet: warrantDetails,
        duration: totalHoursDuration,
        incNum: incidentNumber,
        repNum: reportNumber,
      })
    );
  });


  $(".weaponreg-timeline-persons-tags-holder").on(
    "keydown",
    ".tag-weaponreg-input",
    function (e) {
      if (e.keyCode === 13) {
        $(".weaponreg-timeline-persons-tags-holder").prepend(
          `<div class="tag">${$(".tag-weaponreg-input").text()}</div>`
        );
        // Have it save instantly if it's an existing report.
        if ($(".weaponreg-timeline-persons-add-btn").hasClass("fa-minus")) {
          $(".weaponreg-timeline-persons-add-btn")
            .removeClass("fa-minus")
            .addClass("fa-plus");
        }
        $(".tag-weaponreg-input").remove();
        canInputReportTag = true;
      }
    }
  );
  //push event data
  $(".weaponreg-timeline-title-holder").on(
    "click",
    ".weaponreg-timeline-save",
    function () {
      let weaponeventid = currentSelectedWeaponEvent;
      let weaponeventtitle = $("#weaponreg-timeline-right-event-title").val();
      let weaponeventdetails = $("#weaponreg-timeline-right-event-details").val();
      let weaponserial = $('#weaponreg-serialNumber').html();

      let personsinvolved = new Array();
      $(".weaponreg-timeline-persons-tags-holder")
        .find("div")
        .each(function () {
          if ($(this).text() != "") {
            personsinvolved.push($(this).text());
          }
        });

        
      //let time = new Date();
      if (weaponeventid == -1){
        //new event
        $.post(
          `https://${GetParentResourceName()}/newWeaponRegEvent`,
          JSON.stringify({
            existing: false,
            id: weaponeventid,
            serialNum: weaponserial,
            title: weaponeventtitle,
            details: weaponeventdetails,
            tags: personsinvolved,
           //time: time.getTime(),
          })
        );
      }
      else{
        //editing event
        $.post(
          `https://${GetParentResourceName()}/newWeaponRegEvent`,
          JSON.stringify({
            existing: true,
            id: weaponeventid,
            serialNum: weaponserial,
            title: weaponeventtitle,
            details: weaponeventdetails,
            tags: personsinvolved,
           //time: time.getTime(),
          })
        );
      }
   
    }
  );

  
//-----------------------------------------------------------------------------











//-------------------------DMV----------------------------------------------


  $(".dmv-search-title").click(function () {
    if (canSearchForVehicles == true) {
      if ($(".dmv-search-input").css("display") == "none") {
        $(".dmv-search-input").slideDown(250);
        $(".dmv-search-input").css("display", "block");
      } else {
        $(".dmv-search-input").slideUp(250);
        setTimeout(() => {
          $(".dmv-search-input").css("display", "none");
        }, 250);
      }
    }
  });

  $("#dmv-search-input").keydown(async function (e) {
    if (e.keyCode === 13 && canSearchForVehicles == true) {
      let name = $("#dmv-search-input").val();
      if (name !== "") {
        canSearchForVehicles = false;
        $(".dmv-items").empty();
        $(".dmv-items").prepend(`<div class="profile-loader"></div>`);

        let result = await $.post(
          `https://${GetParentResourceName()}/searchVehicles`,
          JSON.stringify({
            name: name,
          })
        );
        if (result.length === 0) {
          $(".dmv-items").html(
            `
                            <div class="profile-item" data-id="0">

                                <div style="display: flex; flex-direction: column; margin-top: 2.5px; margin-left: 5px; width: 100%; padding: 5px;">
                                <div style="display: flex; flex-direction: column;">
                                    <div class="profile-item-title">No Vehicles Matching that search</div>
                                    </div>
                                    <div class="profile-bottom-info">
                                    </div>
                                </div>
                            </div>
                    `
          );
          canSearchForVehicles = true;
          return true;
        }
        $(".dmv-items").empty();

        let vehicleHTML = "";

        result.forEach((value) => {
          let paint = value.color;
          let impound = "red-tag";
          let bolo = "red-tag";
          let codefive = "red-tag";
          let stolen = "red-tag";

          if (value.state == 'Impounded') {
            impound = "green-tag";
          }

          if (value.bolo) {
            bolo = "green-tag";
          }

          if (value.code) {
            codefive = "green-tag";
          }

          if (value.stolen) {
            stolen = "green-tag";
          }

          vehicleHTML += `
                        <div class="dmv-item" data-id="${value.id}" data-dbid="${value.dbid}" data-plate="${value.plate}">
                            <img src="${value.image}" class="dmv-image">
                            <div style="display: flex; flex-direction: column; margin-top: 2.5px; margin-left: 5px; width: 100%; padding: 5px;">
                            <div style="display: flex; flex-direction: column;">
                                <div class="dmv-item-title">${value.model}</div>
                                    <div class="dmv-tags">
                                        <div class="dmv-tag ${paint}-color">${value.colorName}</div>
                                        <div class="dmv-tag ${impound}">Impound</div>
                                        <div class="dmv-tag ${bolo}">BOLO</div>
                                        <div class="dmv-tag ${stolen}">Stolen</div>
                                        <div class="dmv-tag ${codefive}">Code 5</div>
                                    </div>
                                </div>
                                <div class="dmv-bottom-info">
                                    <div class="dmv-id">Plate: ${value.plate} · Owner: ${value.owner}</div>
                                </div>
                            </div>
                        </div>
                    `;
        });

        $(".dmv-items").html(vehicleHTML);

        canSearchForVehicles = true;

      }
    }
  });

  $(".dmv-items").on("click", ".dmv-item", function () {
    recentSearchedDMVPlate = $(this).data("plate");
    $.post(
      `https://${GetParentResourceName()}/getVehicleData`,
      JSON.stringify({
        plate: $(this).data("plate"),
      })
    );
  });

  $(".vehicle-information-title-holder").on(
    "click",
    ".vehicle-information-save",
    function () {
      if (canSaveVehicle) {
        canSaveVehicle = false;
        $(".vehicle-information-save").empty();
        $(".vehicle-information-save").prepend(
          `<span class="fas fa-check"></span>`
        );
        setTimeout(() => {
          $(".vehicle-information-save").empty();
          $(".vehicle-information-save").html("Save");
          canSaveVehicle = true;
        }, 750);
        setTimeout(() => {
          let dbid = $(".vehicle-information-title-holder").data(
            "dbid"
          );
          let plate = $(".vehicle-info-plate-input").val();
          let notes = $(".vehicle-info-content").val();

          let imageurl = $(".vehicle-info-image").attr("src");
          let newImageurl = $(".vehicle-info-imageurl-input").val();
          if (newImageurl.includes("base64")) {
            imageurl = "img/not-found.jpg";
          } else {
            imageurl = newImageurl;
          }

          let code5 = false;
          let code5tag = $(".vehicle-tags").find(".code5-tag");
          if (code5tag.hasClass("green-tag")) {
            code5 = true
          }

          let stolen = false;
          let stolentag = $(".vehicle-tags").find(".stolen-tag");
          if (stolentag.hasClass("green-tag")) {
            stolen = true
          }

          let impoundInfo = {}
          impoundInfo.impoundActive = $(".vehicle-tags").find(".impound-tag").hasClass("green-tag")
          impoundInfo.impoundChanged = impoundChanged
          if (impoundChanged === true) {
            if (impoundInfo.impoundActive === true) {
              impoundInfo.plate = $(".impound-plate").val();
              impoundInfo.linkedreport = $(".impound-linkedreport").val();
              impoundInfo.fee = $(".impound-fee").val();
              impoundInfo.time = $(".impound-time").val();
            }
          }

          let numStrikes = 0;
          jQuery("input[name='strikecheck']").each(function() {
            if(this.checked){
              numStrikes+=1;
            }
          });

          $.post(
            `https://${GetParentResourceName()}/saveVehicleInfo`,
            JSON.stringify({
              dbid: dbid,
              plate: plate,
              imageurl: imageurl,
              notes: notes,
              stolen: stolen,
              code5: code5,
              impound: impoundInfo,
              strikes: numStrikes,
            })
          );

          impoundChanged = false;
          $(".vehicle-info-image").attr("src", newImageurl);
        }, 250);
      }
    }
  );

  $(".contextmenu").on("click", ".mark-code-5", function () {
    let tag = $(".vehicle-tags").find(".code5-tag");
    if (tag.hasClass("red-tag")) {
      tag.removeClass("red-tag").addClass("green-tag");
    }
  });

  $(".contextmenu").on("click", ".remove-code-5", function () {
    let tag = $(".vehicle-tags").find(".code5-tag");
    if (tag.hasClass("green-tag")) {
      tag.removeClass("green-tag").addClass("red-tag");
    }
  });

  $(".vehicle-tags").on("contextmenu", ".code5-tag", function (e) {
    let plate = $(".vehicle-info-plate-input").val();
    if (plate) {
      let args = [];
      if ($(this).hasClass("red-tag")) {
        args = [
          {
            className: "mark-code-5",
            icon: "fas fa-check",
            text: "Mark as Code 5",
            info: plate,
            status: "",
          },
        ];
      } else {
        args = [
          {
            className: "remove-code-5",
            icon: "fas fa-times",
            text: "Remove Code 5 Status",
            info: plate,
            status: "",
          },
        ];
      }

      openContextMenu(e, args);
    }
  });

  $(".contextmenu").on("click", ".mark-stolen", function () {
    let tag = $(".vehicle-tags").find(".stolen-tag");
    if (tag.hasClass("red-tag")) {
      tag.removeClass("red-tag").addClass("green-tag");
    }
  });

  $(".contextmenu").on("click", ".remove-stolen", function () {
    let tag = $(".vehicle-tags").find(".stolen-tag");
    if (tag.hasClass("green-tag")) {
      tag.removeClass("green-tag").addClass("red-tag");
    }
  });

  $(".vehicle-tags").on("contextmenu", ".stolen-tag", function (e) {
    let plate = $(".vehicle-info-plate-input").val();
    if (plate) {
      let args = [];
      if ($(this).hasClass("red-tag")) {
        args = [
          {
            className: "mark-stolen",
            icon: "fas fa-check",
            text: "Mark as Stolen",
            info: plate,
            status: "",
          },
        ];
      } else {
        args = [
          {
            className: "remove-stolen",
            icon: "fas fa-times",
            text: "Remove Code 5 Status",
            info: plate,
            status: "",
          },
        ];
      }

      openContextMenu(e, args);
    }
  });

  $(".contextmenu").on("click", ".impound-vehicle", function () {
    const plate = $(this).data("info");

    let tag = $(".vehicle-tags").find(".impound-tag");
    if (tag.hasClass("red-tag")) {
      tag.removeClass("red-tag").addClass("green-tag");
    }

    let numCheckboxset = 0
    jQuery("input[name='strikecheck']").each(function() {
      
      if(this.checked) {
        numCheckboxset +=1;
      }
      
    });
    const model = $(this).data("status")
    $.post(
      `https://${GetParentResourceName()}/impoundVehicle`,
      JSON.stringify({
        plate: plate,
        strikes: numCheckboxset,
        model: model,
      })
    );
  });

  $(".contextmenu").on("click", ".remove-impound", function () {
    let tag = $(".vehicle-tags").find(".impound-tag");
    if (tag.hasClass("green-tag")) {
      tag.removeClass("green-tag").addClass("red-tag");
    }

    const plate = $(this).data("info");
     $.post(
      `https://${GetParentResourceName()}/removeImpound`,
      JSON.stringify({
        plate: plate,
      })
    );
      
  });


  $(".vehicle-tags").on("contextmenu", ".impound-tag", function (e) {
    let plate = $(".vehicle-info-plate-input").val();
    let model = $(".vehicle-info-model-input").data("modelName");
    if (plate) {
      let args = [];
      if ($(this).hasClass("red-tag")) {
        args = [
          {
            className: "impound-vehicle",
            icon: "fas fa-check",
            text: "Set Police Impound",
            info: plate,
            status: model,
          },
        ];
      } else {
        args = [
          {
            className: "remove-impound",
            icon: "fas fa-times",
            text: "Remove Police Impound",
            info: plate,
            status: "",
          },
        ];
      }
      openContextMenu(e, args);
    }
  });

  $(".contextmenu").on("click", ".view-profile", async function () {
    const cid = $(this).data("info");
    fidgetSpinner(".profile-page-container");
    currentTab = ".profile-page-container";
    $(".profile-search-input").slideDown(250);
    $(".profile-search-input").css("display", "block");
    $("#profile-search-input:text").val(cid.toString());
    canSearchForProfiles = false;
     let result = await $.post(
      `https://${GetParentResourceName()}/searchProfiles`,
      JSON.stringify({
        name: cid,
      })
    );

    searchProfilesResults(result);
  });

  $(".contextmenu").on("click", ".view-incident", function () {
    const incidentId = $(this).data("info");
    fidgetSpinner(".incidents-page-container");
    currentTab = ".incidents-page-container";
    setTimeout(() => {
      $(".incidents-search-input").slideDown(250);
      $(".incidents-search-input").css("display", "block");
      setTimeout(() => {
        $("#incidents-search-input:text").val(incidentId.toString());
        canSearchForProfiles = false;
        $.post(
          `https://${GetParentResourceName()}/searchIncidents`,
          JSON.stringify({
            incident: incidentId.toString(),
          })
        );
        $(".incidents-items").empty();
        $(".incidents-items").prepend(
          `<div class="profile-loader"></div>`
        );
        setTimeout(() => {
          $.post(
            `https://${GetParentResourceName()}/getIncidentData`,
            JSON.stringify({
              id: incidentId.toString(),
            })
          );
        }, 250);
      }, 250);
    }, 250);
  });

  $(".contextmenu").on("click", ".view-warrant", function () {
    const warrantId = $(this).data("info");
    fidgetSpinner(".doj-page-container");
    currentTab = ".doj-page-container";
    setTimeout(() => {
      $(".warrants-search-input").slideDown(250);
      $(".warrants-search-input").css("display", "block");
      setTimeout(() => {
        $("#warrants-search-input:text").val(warrantId.toString());
        canSearchForWarrants = false;
        $.post(
          `https://${GetParentResourceName()}/searchWarrants`,
          JSON.stringify({
            warrant: warrantId,
          })
        );
        $(".doj-warrants-list").empty();
        $(".doj-warrants-list").prepend(
          `<div class="profile-loader"></div>`
        );
   
        setTimeout(() => {
          $.post(
            `https://${GetParentResourceName()}/getWarrantData`,
            JSON.stringify({
              warrantId: warrantId,
            })
          );
        }, 250);
      }, 250);
    }, 250);
  });

  $(".contextmenu").on("click", ".view-report", function () {
    const reportId = $(this).data("info");
    
    fidgetSpinner(".reports-page-container");
    currentTab = ".reports-page-container";
    setTimeout(() => {
      $(".reports-search-input").slideDown(250);
      $(".reports-search-input").css("display", "block");
      setTimeout(() => {
        $("#reports-search-input:text").val(reportId.toString());
        canSearchForReports = false;
        $.post(
          `https://${GetParentResourceName()}/searchReports`,
          JSON.stringify({
            reportId: reportId.toString(),
          })
        );
        $(".reports-items").empty();
        $(".reports-items").prepend(
          `<div class="profile-loader"></div>`
        );
        setTimeout(() => {
          $.post(
            `https://${GetParentResourceName()}/getReportData`,
            JSON.stringify({
              id: reportId.toString(),
            })
          );
        }, 250);
      }, 250);
    }, 250);
  });

  $(".contextmenu").on("click", ".track-person", function () {
    const personCID = $(this).data("info");


      $.post(`https://${GetParentResourceName()}/trackPerson`,
      JSON.stringify({
        personCID: personCID,
      })
    );

  });

  $(".contextmenu").on("click", ".call-person", function () {
    const phoneNumber = $(this).data("info");
    const name = $(this).data("status");
    console.log("p#", phoneNumber);
      $.post(`https://${GetParentResourceName()}/callPerson`,
      JSON.stringify({
        number: phoneNumber,
        name: name,
      })
    );

  });

  
  $(".contextmenu").on("click", ".end-probation", function () {
    const personCID = $(this).data("info");


      $.post(`https://${GetParentResourceName()}/endProbation`,
      JSON.stringify({
        personCID: personCID,
      })
    );

  });
  
  $(".contextmenu").on("click", ".remove-my-incident", function () {
    const incidentId = $(this).data("info");

    fidgetSpinner(".incidents-page-container");
    currentTab = ".incidents-page-container";

      $.post(`https://${GetParentResourceName()}/deleteIncident`,
      JSON.stringify({
        incidentId: incidentId,
      })
    );

    setTimeout(() => {
      $(".incidents-search-refresh").empty();
      $(".incidents-search-refresh").html("Refresh");
      canRefreshIncidents = true;
      $.post(`https://${GetParentResourceName()}/getAllIncidents`, JSON.stringify({}));
    }, 1500);

  });

  
  $(".contextmenu").on("click", ".remove-my-report", function () {
    const reportId = $(this).data("info");

    fidgetSpinner(".reports-page-container");
    currentTab = ".reports-page-container";

      $.post(`https://${GetParentResourceName()}/deleteReport`,
      JSON.stringify({
        reportId: reportId,
      })
    );
    
    setTimeout(() => {
      $(".reports-search-refresh").empty();
      $(".reports-search-refresh").html("Refresh");
      canRefreshReports = true;
      $.post(`https://${GetParentResourceName()}/getAllReports`, JSON.stringify({}));
    }, 1500);

  });

  $(".contextmenu").on("click", ".remove-warrant", function () {
    const warrantId = $(this).data("info");

    fidgetSpinner(".doj-page-container");
    currentTab = ".doj-page-container";

      $.post(`https://${GetParentResourceName()}/removeWarrant`,
      JSON.stringify({
        warrantId: warrantId,
      })
    );

  });
  $(".contextmenu").on("click", ".deny-warrant", function () {
    const warrantId = $(this).data("info");

    fidgetSpinner(".doj-page-container");
    currentTab = ".doj-page-container";

      $.post(`https://${GetParentResourceName()}/removeWarrant`,
      JSON.stringify({
        warrantId: warrantId,
      })
    );

  });

  $(".warrants-items").on("contextmenu", ".warrants-item", function (e) {
    //let information = $(this).html()
    //if (information) {
    if(PoliceJobs[playerJob] || DojJobs[playerJob]){
      args = [
        {
          className: "view-profile",
          icon: "far fa-eye",
          text: "View Profile",
          info: $(this).data("cid"),
          status: "",
        },
        {
          className: "view-incident",
          icon: "fas fa-search",
          text: "View Incident",
          info: $(this).data("id"),
          status: "",
        },
        {
          className: "view-warrant",
          icon: "fas fa-search",
          text: "View Warrant",
          info: $(this).data("warrantid"),
          status: "",
        },
      ];
      openContextMenu(e, args);
    }
    //}
  });

  
  $(".doj-warrants-list").on("contextmenu", ".doj-warrants-item", function (e) {
    //let information = $(this).html()
    //if (information) {
    args = [
      {
        className: "view-profile",
        icon: "far fa-eye",
        text: "View Profile",
        info: $(this).data("cid"),
        status: "",
      },
      {
        className: "view-incident",
        icon: "fas fa-search",
        text: "View Incident",
        info: $(this).data("inc"),
        status: "",
      },
      {
        className: "view-report",
        icon: "fas fa-search",
        text: "View Report",
        info: $(this).data("rep"),
        status: "",
      },
    ];
    //if($(this).data("expired")){
      args.push({
        className: "remove-warrant",
        icon: "fas fa-trash",
        text: "Delete Warrant",
        info: $(this).data("id"),
        status: "",
      });
   // }
    if($(this).data("state")==0 && playerJob==="judge"&& !$(this).data("expired")){
      args.push({
        className: "deny-warrant",
        icon: "fas fa-trash",
        text: "Deny Warrant",
        info: $(this).data("id"),
        status: "",
      });
    }
    openContextMenu(e, args);
    //}
  });
  $(".doj-lawyers-unit-list").on("contextmenu", ".active-unit-item", function (e) {
    //let information = $(this).html()
    //if (information) {
      args = [
        {
          className: "call-person",
          icon: "fas fa-phone-rotary",
          text: "Call Person",
          info: $(this).data("phonenumber"),
          status: $(this).data("name"),
        },
      ];
    
    openContextMenu(e, args);
    //}
  });
  $(".doj-prisoners-list").on("contextmenu", ".active-unit-item", function (e) {
    //let information = $(this).html()
    //if (information) {
      args = [
        {
          className: "track-person",
          icon: "fad fa-search-location",
          text: "Track Location",
          info: $(this).data("id"),
          status: "",
        },
      ];
    
    openContextMenu(e, args);
    //}
  });
  $(".doj-probation-list").on("contextmenu", ".active-unit-item", function (e) {
    //let information = $(this).html()
    //if (information) {
      args = [
        {
          className: "track-person",
          icon: "fas fa-search",
          text: "Track Location",
          info: $(this).data("id"),
          status: "",
        },
      ];

      if(PoliceJobs[playerJob] || playerJob==="judge"){
        args.push({
          className: "end-probation",
          icon: "fas fa-trash",
          text: "End Probation",
          info: $(this).data("id"),
          status: "",
        });
      }
    
    openContextMenu(e, args);
    //}
  });

  
  $(".incidents-items").on("contextmenu", ".incidents-item", function (e) {
    //let information = $(this).html()
    //if (information) {
    args = [];

    if($(this).data("author")===MyName){
      args.push({
        className: "remove-my-incident",
        icon: "fas fa-trash",
        text: "Delete Incident",
        info: $(this).data("id"),
        status: "",
      });
    }
    
    openContextMenu(e, args);
    //}
  });

    
  $(".reports-items").on("contextmenu", ".reports-item", function (e) {
    //let information = $(this).html()
    //if (information) {
    args = [];

    if($(this).data("author")===MyName){
      args.push({
        className: "remove-my-report",
        icon: "fas fa-trash",
        text: "Delete Report",
        info: $(this).data("id"),
        status: "",
      });
    }
    
    openContextMenu(e, args);
    //}
  });



  $(".contextmenu").on("click", ".toggle-duty", function () {
    let info = $(this).data("info");
    let currentStatus = $(`[data-id="${info}"]`)
      .find(".unit-status")
      .html();
    if (currentStatus == "10-8") {
      $(`[data-id="${info}"]`).find(".unit-status").html("10-7");
      $(`[data-id="${info}"]`)
        .find(".unit-status")
        .removeClass("green-status")
        .addClass("yellow-status");
      $.post(
        `https://${GetParentResourceName()}/toggleDuty`,
        JSON.stringify({
          cid: info,
          status: 0,
        })
      );
    } else if (currentStatus == "10-7") {
      $(`[data-id="${info}"]`).find(".unit-status").html("10-8");
      $(`[data-id="${info}"]`)
        .find(".unit-status")
        .removeClass("yellow-status")
        .addClass("green-status");
      $.post(
        `https://${GetParentResourceName()}/toggleDuty`,
        JSON.stringify({
          cid: info,
          status: 1,
        })
      );
    }
  });

  $(".contextmenu").on("click", ".set-callsign", function () {
    let info = $(this).data("info");
    $(".callsign-container").fadeIn(0);
    $(".callsign-inner-container").slideDown(500);
    $(".callsign-inner-container").fadeIn(500);
    $(".callsign-container").data("id", info);
  });

  $(".contextmenu").on("click", ".set-radio", function () {
    let info = $(this).data("info");
    $(".radio-container").fadeIn(0);
    $(".radio-inner-container").slideDown(500);
    $(".radio-inner-container").fadeIn(500);
    $(".radio-container").data("id", info);
  });

  $(".contextmenu").on("click", ".set-waypoint", function () {
    let info = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/setWaypointU`,
      JSON.stringify({
        cid: info,
      })
    );
  });

  $(".active-unit-list").on("contextmenu", ".active-unit-item", function (e) {
    let cid = $(this).data("id");
    if (cid) {
      args = [
        {
          className: "toggle-duty",
          icon: "fas fa-thumbtack",
          text: "Toggle Duty",
          info: cid,
          status: "",
        },
        {
          className: "set-callsign",
          icon: "far fa-id-badge",
          text: "Set Callsign",
          info: cid,
          status: "",
        },
        {
          className: "set-radio",
          icon: "fas fa-broadcast-tower",
          text: "Set Radio",
          info: cid,
          status: "",
        },
        {
          className: "set-waypoint",
          icon: "fas fa-map-marker-alt",
          text: "Set Waypoint",
          info: cid,
          status: "",
        },
        {
          className: "set-subdivision",
          icon: "fas fa-users",
          text: "Set Sub Division",
          info: cid,
          status: "",
        },
      ];
      openContextMenu(e, args);
    }
  });

  $(".contextmenu").on("click", ".set-waypoint", function () {
    const callId = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/setWaypoint`,
      JSON.stringify({
        callid: callId,
      })
    );
  });

  $(".contextmenu").on("click", ".set-subdivision", function () {
    let info = $(this).data("info");
    $(".subdivision-container").fadeIn(0);
    $(".subdivision-inner-container").slideDown(500);
    $(".subdivision-inner-container").fadeIn(500);
    $(".subdivision-container").data("id", info);
  });

  $(".subdivision-buttons").on("click", ".subdivision-cancel", function () {
    $(".subdivision-inner-container").slideUp(500);
    $(".subdivision-inner-container").fadeOut(500);
    setTimeout(() => {
      $(".subdivision-container").slideUp(500);
      $(".subdivision-container").fadeOut(500);
      $(".subdivision-input").val("");
    }, 500);
  });

  $(".subdivision-buttons").on("click", ".subdivision-submit", function () {
    const subdiv = $(".subdivision-input").val();
    if (subdiv.length > 1) {
      let editingsubdiv = $(".subdivision-container").data("id");
      let newsubdiv = `(${subdiv})`;
      $(`[data-id="${editingsubdiv}"]`)
        .find(".unit-subdiv")
        .html(newsubdiv);

      $.post(
        `https://${GetParentResourceName()}/setSubdivision`,
        JSON.stringify({
          cid: editingsubdiv,
          newsubdivision: subdiv,
        })
      );

      $(".subdivision-inner-container").slideUp(500);
      $(".subdivision-inner-container").fadeOut(500);
      setTimeout(() => {
        $(".subdivision-container").slideUp(500);
        $(".subdivision-container").fadeOut(500);
        $(".subdivision-input").val("");
      }, 500);
    }
  });

  $(".contextmenu").on("click", ".call-attach", function () {
    const callId = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/callAttach`,
      JSON.stringify({
        callid: callId,
      })
    );
    $.each(attachedCallsIDs, function(index, value){
      if (value!=0){
        $(".active-calls-item").filter("[data-id='" + value + "']").children()
        .children().find(".player-attached").css("display", "none");
        
        $.post(
          `https://${GetParentResourceName()}/callDetach`,
          JSON.stringify({
            callid: value,
          })
        );
      }
    });
    $(".active-calls-item").filter("[data-id='" +  attachedCallsIDs[attachedCallsIDs.length-1] + "']").css("position", "");
    $(".active-calls-item").filter("[data-id='" + attachedCallsIDs[attachedCallsIDs.length-1] + "']").css("margin-top", "");
    $(".active-calls-item").filter("[data-id='" + attachedCallsIDs[attachedCallsIDs.length-1] + "']").css("width", "");
    $(".active-calls-item").filter("[data-id='" + attachedCallsIDs[attachedCallsIDs.length-1] + "']").css("background-color", "#162738");
    $(".active-calls-list").css("margin-top", "10px");


    attachedCallsIDs[attachedCallsIDs.length] = callId;

    $(".active-calls-item").filter("[data-id='" + callId + "']").children()
    .children().find(".player-attached").css("display", "unset");
    $(".active-calls-item").filter("[data-id='" + callId + "']").css("position", "absolute");
    $(".active-calls-item").filter("[data-id='" + callId + "']").css("margin-top", "-110px");
    $(".active-calls-item").filter("[data-id='" + callId + "']").css("width", "47.5vh");
    $(".active-calls-item").filter("[data-id='" + callId + "']").css("background-color", "#5597D9");
    $(".active-calls-list").css("margin-top", "120px");

  });

  $(".contextmenu").on("click", ".call-detach", function () {
    const callId = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/callDetach`,
      JSON.stringify({
        callid: callId,
      })
    );
    attachedCallsIDs[attachedCallsIDs.indexOf(callId)] = 0;
    $(".active-calls-item").filter("[data-id='" + callId + "']").children()
    .children().find(".player-attached").css("display", "none");

    $(".active-calls-item").filter("[data-id='" + callId + "']").css("position", "");
    $(".active-calls-item").filter("[data-id='" + callId + "']").css("margin-top", "");
    $(".active-calls-item").filter("[data-id='" + callId + "']").css("width", "");
    $(".active-calls-item").filter("[data-id='" + callId + "']").css("background-color", "#162738");
    $(".active-calls-list").css("margin-top", "10px");
    
  });

  $(".contextmenu").on("click", ".remove-blip", function () {
    const callId = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/removeCallBlip`,
      JSON.stringify({
        callid: callId,
      })
    );
  });

  $(".contextmenu").on("click", ".attached-units", function () {
    const callId = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/attachedUnits`,
      JSON.stringify({
        callid: callId,
      })
    );
  });

  $("#respondcalls").keydown(function (e) {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13 && !e.shiftKey) {
      const callid = $(".respond-calls-container").data("id");
      e.preventDefault();
      const time = new Date();
      $.post(
        `https://${GetParentResourceName()}/sendCallResponse`,
        JSON.stringify({
          message: $(this).val(),
          time: time.getTime(),
          callid: callid,
        })
      );
      $(this).val("");
    }
  });

  $(".contextmenu").on("click", ".respond-call", function () {
    const callId = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/getCallResponses`,
      JSON.stringify({
        callid: callId,
      }));

     
    /**$(".respond-calls").fadeIn(0)
    $(".respond-calls-container").fadeIn(250)
    $(".close-all").css("filter", "brightness(15%)");
    $("#respondcalls").val("")*/
  });

  $(".active-calls-list").on(
    "contextmenu",
    ".active-calls-item",
    function (e) {
      const callId = $(this).data("id");
      const canRespond = $(this).data("canrespond");
      if (callId) {
        if (canRespond == true) {
          args = [
            {
              className: "respond-call",
              icon: "fas fa-reply",
              text: "Respond to Call",
              info: callId,
              status: "",
            },
            {
              className: "attached-units",
              icon: "fas fa-link",
              text: "Attached Units",
              info: callId,
              status: "",
            },
            {
              className: "call-detach",
              icon: "fas fa-sign-out-alt",
              text: "Detach",
              info: callId,
              status: "",
            },
            {
              className: "call-attach",
              icon: "fas fa-sign-in-alt",
              text: "Respond",
              info: callId,
              status: "",
            },
            {
              className: "Set-Waypoint",
              icon: "fas fa-map-marker-alt",
              text: "Set Waypoint",
              info: callId,
              status: "",
            },
            {
              className: "remove-blip",
              icon: "fa-solid fa-circle-minus",
              text: "Remove Blip",
              info: callId,
              status: "",
            },
          ];
        } else if (canRespond == false) {
          args = [
            {
              className: "attached-units",
              icon: "fas fa-link",
              text: "Attached Units",
              info: callId,
              status: "",
            },
            {
              className: "call-detach",
              icon: "fas fa-sign-out-alt",
              text: "Detach",
              info: callId,
              status: "",
            },
            {
              className: "call-attach",
              icon: "fas fa-sign-in-alt",
              text: "Respond",
              info: callId,
              status: "",
            },
            {
              className: "set-waypoint",
              icon: "fas fa-map-marker-alt",
              text: "Set Waypoint",
              info: callId,
              status: "",
            },
            {
              className: "remove-blip",
              icon: "fa-solid fa-circle-minus",
              text: "Remove Blip",
              info: callId,
              status: "",
            },
          ];
        }

        openContextMenu(e, args);
      }
    }
  );

  $(".contextmenu").on("click", ".call-dispatch-detach", function () {
    const cid = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/callDispatchDetach`,
      JSON.stringify({
        callid: $(".dispatch-attached-units-container").attr("id"),
        cid: cid,
      })
    );
    $(".dispatch-attached-unit-item").filter(`[data-id="${cid}"]`).remove();
  });

  $(".contextmenu").on("click", ".Set-Dispatch-Waypoint", function () {
    const cid = $(this).data("info");
    $.post(
      `https://${GetParentResourceName()}/setDispatchWaypoint`,
      JSON.stringify({
        callid: $(".dispatch-attached-units-container").attr("id"),
        cid: cid,
      })
    );
  });

  $(".dispatch-attached-units-holder").on(
    "contextmenu",
    ".dispatch-attached-unit-item",
    function (e) {
      const cid = $(this).data("id");
      if (cid) {
        args = [
          {
            className: "set-waypoint",
            icon: "fas fa-map-marker-alt",
            text: "Set Waypoint",
            info: cid,
            status: "",
          },
        ];
        openContextMenu(e, args);
      }
    }
  );

  $(".contextmenu").on("click", ".dispatch-reply", function () {
    const callsign = $(this).data("info");
    const currVal = $(".dispatch-input").val();
    if (currVal === "") {
      $(".dispatch-input").val(callsign + " ");
    } else {
      $(".dispatch-input").val(currVal + " " + callsign + " ");
    }
    $(".dispatch-input").focus();
  });

  $(".dispatch-items").on(
    "contextmenu",
    ".dispatch-item-message",
    function (e) {
      const Callsign = $(this).data("author");

      var mySubString = Callsign.substring(
        Callsign.indexOf("(") + 1,
        Callsign.lastIndexOf(")")
      );

      args = [
        {
          className: "dispatch-reply",
          icon: "fas fa-reply",
          text: "Reply",
          info: mySubString,
          status: "",
        },
      ];
      openContextMenu(e, args);
    }
  );

   $(".active-phonecalls-list").on(
    "contextmenu",
    ".active-calls-item",
    function (e) {
      const callid = $(this).data("id");
      if (callid) {
        args = [
          {
            className: "respond-phonecall",
            icon: "fas fa-reply",
            text: "Send Response",
            info: callid,
            status: "",
          },
        ];
        openContextMenu(e, args);
      }
    }
  );
  $(".contextmenu").on("click", ".respond-phonecall", function () {
    const callid = $(this).data("info");
    $(".respondphone-container").fadeIn(0);
    $(".respondphone-inner-container").slideDown(500);
    $(".respondphone-inner-container").fadeIn(500);
    $(".respondphone-container").data("id", callid);
  });

  $(".respondphone-buttons").on("click", ".respondphone-cancel", function () {
    $(".respondphone-inner-container").slideUp(500);
    $(".respondphone-inner-container").fadeOut(500);
    setTimeout(() => {
      $(".respondphone-container").slideUp(500);
      $(".respondphone-container").fadeOut(500);
      $(".respondphone-input").val("");
    }, 500);
  });

  $(".respondphone-buttons").on("click", ".respondphone-submit", function () {
    const message = $(".respondphone-input").val();
    if (message.length > 0) {
      let respondingcallid = $(".respondphone-container").data("id");
      $.post(
        `https://${GetParentResourceName()}/sendReplyMessage`,
        JSON.stringify({
          cid: respondingcallid,
          replyMessage: message,
        })
      );

      $(".respondphone-inner-container").slideUp(500);
      $(".respondphone-inner-container").fadeOut(500);
      setTimeout(() => {
        $(".respondphone-container").slideUp(500);
        $(".respondphone-container").fadeOut(500);
        $(".respondphone-input").val("");
      }, 500);
    }
  });

  $(".callsign-buttons").on("click", ".callsign-cancel", function () {
    $(".callsign-inner-container").slideUp(500);
    $(".callsign-inner-container").fadeOut(500);
    setTimeout(() => {
      $(".callsign-container").slideUp(500);
      $(".callsign-container").fadeOut(500);
      $(".callsign-input").val("");
    }, 500);
  });

  $(".callsign-buttons").on("click", ".callsign-submit", function () {
    const callsign = $(".callsign-input").val();
    if (callsign.length > 2) {
      let editingcallsign = $(".callsign-container").data("id");
      let name = $(`[data-id="${editingcallsign}"]`)
        .find(".unit-name")
        .html()
        .replace(/\s*(?:\[[^\]]*\]|\([^)]*\))\s*/g, "");
      let newunitname = `(${callsign}) ${name}`;
      $(`[data-id="${editingcallsign}"]`)
        .find(".unit-name")
        .html(newunitname);
      $.post(
        `https://${GetParentResourceName()}/setCallsign`,
        JSON.stringify({
          cid: editingcallsign,
          newcallsign: callsign,
        })
      );

      $(".callsign-inner-container").slideUp(500);
      $(".callsign-inner-container").fadeOut(500);
      setTimeout(() => {
        $(".callsign-container").slideUp(500);
        $(".callsign-container").fadeOut(500);
        $(".callsign-input").val("");
      }, 500);
    }
  });

  $(".radio-buttons").on("click", ".radio-cancel", function () {
    $(".radio-inner-container").slideUp(500);
    $(".radio-inner-container").fadeOut(500);
    setTimeout(() => {
      $(".radio-container").slideUp(500);
      $(".radio-container").fadeOut(500);
      $(".radio-input").val("");
    }, 500);
  });

  $(".radio-buttons").on("click", ".radio-submit", function () {
    const radio = $(".radio-input").val();
    if (radio.length > 0) {
      let editingradio = $(".radio-container").data("id");
      let newunitname = `${radio}`;
      $(`[data-id="${editingradio}"]`)
        .find(".unit-radio")
        .html(newunitname);
      $.post(
        `https://${GetParentResourceName()}/setRadio`,
        JSON.stringify({
          cid: editingradio,
          newradio: radio,
        })
      );

      $(".radio-inner-container").slideUp(500);
      $(".radio-inner-container").fadeOut(500);
      setTimeout(() => {
        $(".radio-container").slideUp(500);
        $(".radio-container").fadeOut(500);
        $(".radio-input").val("");
      }, 500);
    }
  });

  $(".cams-items").click(function () {
    var camId = this.id;
    $.post(
      `https://${GetParentResourceName()}/openCamera`,
      JSON.stringify({
        cam: camId,
      })
    );
    $.post(`https://${GetParentResourceName()}/escape`, JSON.stringify({}));
  })

  var draggedElement = 0;
  var dragging = false;

  $(".active-unit-list").on("click", ".active-unit-item", function (e) {
    if (dragging) {
      $("#draggedItem").css("opacity", 0.0);
      document.getElementById("draggedItem").innerHTML = "";
      dragging = false;
    } else {
      dragging = true;
      draggedElement = $(this).data("id");
      let draggedItemHtml = $(this).html();
      document.getElementById("draggedItem").innerHTML = draggedItemHtml;
      document.getElementById("draggedItem").style.left = "cursorX-50";
      document.getElementById("draggedItem").style.top = "cursorY-50";
      document.getElementById("draggedItem").style.opacity = "0.5";
    }
  });

  document.onmousemove = handleMouseMove;

  function handleMouseMove(event) {
    let dot, eventDoc, doc, body, pageX, pageY;
    event = event || window.event; // IE-ism
    if (event.pageX == null && event.clientX != null) {
      eventDoc = (event.target && event.target.ownerDocument) || document;
      doc = eventDoc.documentElement;
      body = eventDoc.body;

      event.pageX =
        event.clientX +
        ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
        ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
      event.pageY =
        event.clientY +
        ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
        ((doc && doc.clientTop) || (body && body.clientTop) || 0);
    }

    if (dragging) {
      cursorX = event.pageX;
      cursorY = event.pageY;
      document.getElementById("draggedItem").style.left =
        "" + cursorX - 50 + "px";
      document.getElementById("draggedItem").style.top =
        "" + cursorY - 50 + "px";
    }
  }

  $(".active-calls-list").on("click", ".active-calls-item", function (e) {
    const callId = $(this).data("id");
    $("#draggedItem").css("opacity", 0.0);
    document.getElementById("draggedItem").innerHTML = "";
    dragging = false;
    if (callId && draggedElement) {
      $.post(
        `https://${GetParentResourceName()}/callDragAttach`,
        JSON.stringify({
          callid: callId,
          cid: draggedElement,
        })
      );
      draggedElement = 0;
    }
  });




  //------------------JOB ROOT COLORS--------------------
  function JobColors(sentJob) {
    if (sentJob) {
      if (PoliceJobs[sentJob] !== undefined) {
        document.documentElement.style.setProperty(
          "--list-item",
          "#15263884"
        );
        document.documentElement.style.setProperty(
          "--frame-color",
          "#0d090a"
        );
        document.documentElement.style.setProperty(
          "--mainbackground-color",
          "#03182ed6"
        );
        document.documentElement.style.setProperty(
          "--button-color",
          "#2dabe1"
        );
        document.documentElement.style.setProperty(
          "--button-hover-color",
          "#8ed5f3"
        );
        document.documentElement.style.setProperty(
          "--page-subheader-color",
          "#2dabe157"
        );
        document.documentElement.style.setProperty(
          "--page-frame-color",
          "#374955c6"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button",
          "#272731de"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button-hover",
          "#606072"
        );
        
        if (sentJob === 'bcso'){
          $(".badge-logo").attr("src", "img/BCSO.png");
        }
        else if (sentJob==="police"){
          $(".badge-logo").attr("src", "img/LSPD.png");
        }
        else{
          $(".badge-logo").attr("src", "img/LSPD.png");
        }
       
        $(".header-title").html("UNIFIED POLICE DEPARTMENT");
        $(".weaponreg-nav-item").show();
        $(".doj-nav-item").show();
        $(".expunge-btn").hide();
        $(".cams-nav-item").show();
        $(".calls-container").show();
        $(".warrants-container").show();
        $(".phonecalls-container").show();
        $(".dispatch-container").show();
        $(".reports-container").show();
        $(".penalcode-nav-item").show();
        $(".reports-nav-item").show();
        $(".incidents-nav-item").show();
        $(".dmv-nav-item").show();
        $(".bolo-nav-item").show();
        $(".bolo-nav-item").html("BOLOs");
        $(".bolos-search-title").html("Bolos");
        $("#bolos-search-input").attr("placeholder", "Search Bolo...");
        $(".manage-bolos-title").html("Manage Bolo");
        $(".manage-bolos-editing-title").html(
          "You are currently creating a new BOLO"
        );
        $(".boloplate-title").html("Plate");
        $(".boloowner-title").html("Owner");
        $(".boloindividual-title").html("Individual");
        $("#boloplate").attr("placeholder", "Place plate here...");
        $("#bolodetail").attr(
          "placeholder",
          "Bolo detail goes here..."
        );
        $("#boloowner").attr(
          "placeholder",
          "Place vehicle owner here..."
        );
        $("#boloindividual").attr(
          "placeholder",
          "Place invidivual here..."
        );
        $("#home-warrants-container").fadeIn(0);
        $("#home-reports-container").fadeOut(0);
        $(".quote-span").html("How come?");
        $(".incidents-nav-item").show();
        $(".bolo-nav-item").show();
        $(".dmv-nav-item").show();
        $(".cams-nav-item").show();
        $(".dispatch-title-ofsomesort").html("311");
        $(".dispatch-comms-container").fadeIn(0);
        $(".manage-profile-name-input-1").attr("readonly", true);
        $(".manage-profile-name-input-2").attr("readonly", true);
        $("#reports-officers-involved-tag-title").html(
          "Officers Involved"
        );
        $(".roster-iframe").attr("src", rosterLink);

        $(".manage-profile-save").css("display", "block");
        $(".manage-profile-editing-title").css("display", "block");
        $(".manage-incidents-create").css("display", "block");
        $(".manage-incidents-save").css("display", "block");
        $(".manage-incidents-editing-title").css("display", "block");
        $(".manage-reports-new").css("display", "block");
        $(".manage-reports-save").css("display", "block");
        $(".manage-reports-editing-title").css("display", "block");
        $(".vehicle-information-save").css("display", "block");
        $(".vehicle-information-title").css("margin-right", "0px").css("width", "81%");
        $(".manage-incidents-title ").css("margin-right", "0px")
        $(".manage-reports-title").css("margin-right", "0px").css("width", "66%");
      } else if (AmbulanceJobs[sentJob] !== undefined) {
        $("#home-warrants-container").fadeOut(0);
        $("#home-reports-container").fadeIn(0);
        document.documentElement.style.setProperty(
          "--list-item",
          "#15263884"
        );
        document.documentElement.style.setProperty(
          "--frame-color",
          "#0d090a"
        );
        document.documentElement.style.setProperty(
          "--mainbackground-color",
          "#03182ed6"
        );
        document.documentElement.style.setProperty(
          "--button-color",
          "#2dabe1"
        );
        document.documentElement.style.setProperty(
          "--button-hover-color",
          "#8ed5f3"
        );
        document.documentElement.style.setProperty(
          "--page-subheader-color",
          "#2dabe157"
        );
        document.documentElement.style.setProperty(
          "--page-frame-color",
          "#374955c6"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button",
          "#272731de"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button-hover",
          "#606072"
        );

        $(".badge-logo").attr("src", "img/ems_badge.png");
        $(".header-title").html("PILLBOX HILL MEDICAL CENTER");
       
        $(".bolo-nav-item").html("ICU");
        $(".bolos-search-title").html("ICU Check-ins");
        $("#bolos-search-input").attr(
          "placeholder",
          "Search Check-ins..."
        );
        $(".manage-bolos-title").html("Manage ICU Check-in");
        $(".manage-bolos-editing-title").html(
          "You are creating a new ICU Check-in"
        );
        $(".boloplate-title").html("Estimated Recovery");
        $(".boloowner-title").html("Emergency Contact");
        $(".boloindividual-title").html("Patient");
        $("#boloplate").attr(
          "placeholder",
          "Enter recovery time here..."
        );
        $("#bolodetail").attr(
          "placeholder",
          "Enter ICU Check-in details here..."
        );
        $("#boloowner").attr(
          "placeholder",
          "Enter emergency contact here..."
        );
        $("#boloindividual").attr(
          "placeholder",
          "Enter patient name and CID here..."
        );

        $(".expunge-btn").hide();
        $(".incidents-nav-item").hide();
        $(".doj-nav-item").hide();
        $(".dmv-nav-item").hide();
        $(".weaponreg-nav-item").hide();
        $(".cams-nav-item").hide();
        $("#reports-officers-involved-tag-title").html("EMS Involved");
        $(".dispatch-title-ofsomesort").html("311");
        $(".dispatch-comms-container").fadeIn(0);
        $(".manage-profile-name-input-1").attr("readonly", true);
        $(".manage-profile-name-input-2").attr("readonly", true);
        $(".roster-iframe").attr("src", rosterLink);

        $(".manage-profile-save").css("display", "block");
        $(".manage-profile-editing-title").css("display", "block");
        $(".manage-incidents-create").css("display", "block");
        $(".manage-incidents-save").css("display", "block");
        $(".manage-incidents-editing-title").css("display", "block");
        $(".manage-reports-new").css("display", "block");
        $(".manage-reports-save").css("display", "block");
        $(".manage-reports-editing-title").css("display", "block");
        $(".vehicle-information-save").css("display", "block");
        $(".vehicle-information-title").css("margin-right", "0px").css("width", "81%");
        $(".manage-incidents-title ").css("margin-right", "0px")
        $(".manage-reports-title").css("margin-right", "0px").css("width", "66%");
      } else if (DojJobs[sentJob] !== undefined) {
        document.documentElement.style.setProperty(
          "--list-item",
          "#15263884"
        );
        document.documentElement.style.setProperty(
          "--frame-color",
          "#0d090a"
        );
        document.documentElement.style.setProperty(
          "--mainbackground-color",
          "#03182ed6"
        );
        document.documentElement.style.setProperty(
          "--button-color",
          "#2dabe1"
        );
        document.documentElement.style.setProperty(
          "--button-hover-color",
          "#8ed5f3"
        );
        document.documentElement.style.setProperty(
          "--page-subheader-color",
          "#2dabe157"
        );
        document.documentElement.style.setProperty(
          "--page-frame-color",
          "#374955c6"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button",
          "#272731de"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button-hover",
          "#606072"
        );

    
        $(".badge-logo").attr("src", "img/court.png");
        $(".header-title").html("DEPARTMENT OF JUSTICE");

        $(".doj-nav-item").show();
        $(".weaponreg-nav-item").hide();
        $(".incidents-nav-item").show();
        $(".reports-nav-item").show();
        $(".cams-nav-item").hide();
        $(".calls-container").hide();
        $(".warrants-container").hide();
        $(".phonecalls-container").hide();
        
        //$(".dmv-nav-item").hide();
        $(".bolo-nav-item").hide();
        $(".dispatch-title-ofsomesort").html("311");
        $(".dispatch-comms-container").fadeOut(0);
        $(".manage-profile-name-input-1").attr("readonly", false);
        $(".manage-profile-name-input-2").attr("readonly", false);
        $("#home-warrants-container").css("height", "98%");
        $(".roster-iframe").attr("src", rosterLink);
        if(sentJob==="judge"){
          $(".manage-profile-save").css("display", "block");
          $(".manage-incidents-save").css("display", "block");
          $(".manage-reports-save").css("display", "block");
          $(".expunge-btn").show();
        }
        else{
          $(".manage-profile-save").css("display", "none");
          $(".manage-incidents-save").css("display", "none");
          $(".manage-reports-save").css("display", "none");
        }
        

        $(".manage-profile-editing-title").css("display", "none");
        $(".manage-incidents-create").css("display", "none");
        $(".manage-incidents-title").css("margin-right", "auto");
        $(".manage-incidents-title").css("width", "95%");
        $(".manage-incidents-editing-title").css("display", "none");
        $(".manage-reports-new").css("display", "none");
        $(".manage-reports-editing-title").css("display", "none");
        $(".vehicle-information-save").css("display", "none");
        $(".vehicle-information-title").css("margin-right", "auto").css("width", "95%");
        $(".manage-incidents-title ").css("margin-right", "auto")
        $(".manage-reports-title").css("margin-right", "auto").css("width", "95%");
      }
      else{
        //CIVILIAN SHOW MDT
        document.documentElement.style.setProperty(
          "--list-item",
          "#15263884"
        );
        document.documentElement.style.setProperty(
          "--frame-color",
          "#0d090a"
        );
        document.documentElement.style.setProperty(
          "--mainbackground-color",
          "#03182ed6"
        );
        document.documentElement.style.setProperty(
          "--button-color",
          "#2dabe1"
        );
        document.documentElement.style.setProperty(
          "--button-hover-color",
          "#8ed5f3"
        );
        document.documentElement.style.setProperty(
          "--page-subheader-color",
          "#2dabe157"
        );
        document.documentElement.style.setProperty(
          "--page-frame-color",
          "#374955c6"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button",
          "#272731de"
        );
        document.documentElement.style.setProperty(
          "--nav-item-button-hover",
          "#606072"
        );

        $(".badge-logo").attr("src", "img/court.png");
        $(".header-title").html("PUBLIC RECORDS");

        $(".manage-profile-save").css("display", "none");
        $(".expunge-btn").hide();
        $(".weaponreg-nav-item").hide();
        $(".doj-nav-item").hide();
        $(".cams-nav-item").hide();
        $(".calls-container").hide();
        $(".warrants-container").show();
        $(".phonecalls-container").hide();
        $(".dispatch-container").hide();
        $(".dispatch-comms-container").hide();
        $(".reports-container").hide();
        $(".penalcode-nav-item").hide();
        $(".reports-nav-item").hide();
        $(".incidents-nav-item").hide();
        $(".dmv-nav-item").show();
        $(".bolo-nav-item").hide();
      }
    }
  }
{/* <div class="bulletin-id">ID: ${value.id}</div> */}
  window.addEventListener("message", function (event) {
    let eventData = event.data;
    $(".dispatch-msg-notif").fadeIn(500);
    if (eventData.type == "show") {
      if (eventData.enable == true) {
        rosterLink = eventData.rosterLink;
        playerJob = eventData.job;
        JobColors(playerJob);
        if (PoliceJobs[playerJob] !== undefined || DojJobs[playerJob] !== undefined) {
          $(".manage-profile-licenses-container").removeClass("display_hidden");
          $(".manage-profile-vehs-container").removeClass("display_hidden");
          $(".manage-profile-houses-container").removeClass("display_hidden");
          $(".manage-profile-employment-container").removeClass("display_hidden");
        }

        /* if (PoliceJobs[playerJob] !== undefined || AmbulanceJobs[playerJob] !== undefined) {
          $(".manage-profile-save").css("display", "block");
          $(".manage-profile-editing-title").css("display", "block");
          $(".manage-incidents-create").css("display", "block");
          $(".manage-incidents-save").css("display", "block");
          $(".manage-incidents-editing-title").css("display", "block");
          $(".manage-reports-new").css("display", "block");
          $(".manage-reports-save").css("display", "block");
          $(".manage-reports-editing-title").css("display", "block");
        } else if (DojJobs[playerJob] !== undefined) {
          $(".manage-profile-save").css("display", "none");
          $(".manage-profile-editing-title").css("display", "none");
          $(".manage-incidents-create").css("display", "none");
          $(".manage-incidents-save").css("display", "none");
          $(".manage-incidents-editing-title").css("display", "none");
          $(".manage-reports-new").css("display", "none");
          $(".manage-reports-save").css("display", "none");
          $(".manage-reports-editing-title").css("display", "none");
        } */

        $("body").fadeIn(0);
        $(".close-all").css("filter", "none");
        $(".close-all").fadeOut(0);
        if (!currentTab) {
          currentTab = ".dashboard-page-container";
        }
        $(currentTab).slideDown(250);
        timeShit();
      } else {
        $(".callsign-inner-container").fadeOut(0);
        $(".callsign-container").fadeOut(0);
        $(".radio-inner-container").fadeOut(0);
        $(".radio-container").fadeOut(0);
        $(".icidents-person-search-container").fadeOut(0);
        $(".dispatch-attached-units").fadeOut(0);
        $(".respond-calls").fadeOut(0);
        $(".respond-calls-container").fadeOut(0);
        $("body").slideUp(250);
        $(".close-all").slideUp(250);
      }
    } else if (eventData.type == "data") {
      $(".name-shit").html(eventData.name);
      MyName = eventData.fullname;



      let policeCount = 0;
      let bcsoCount = 0;
      let emsCount = 0;
      let dojCount = 0;
      let fireCount = 0;

      let activeUnits = eventData.activeUnits;
      let cid = eventData.citizenid;
      let onDutyOnly = eventData.ondutyonly;
      $(".active-unit-list").html(' ');
      let unitListHTML = '';

      activeUnits = Object.values(activeUnits)
      activeUnits.forEach((unit) => {
        if (onDutyOnly && unit.duty == 0 && unit.cid != cid) {
          return
        }
        let status = unit.duty == 1 ? "10-8" : '10-7';
        let statusColor = unit.duty == 1 ? "green-status" : 'yellow-status';
        let radioBack = unit.sig100 ? "#7b2c2c" : "var(--color-3)";
        let radio = unit.radio ? unit.radio : "0";
        let callSign = unit.callSign ? unit.callSign : "000";
        let subdivision = unit.subdivision ? unit.subdivision : "";
        let activeInfoJob = `<div class="unit-job active-info-job-unk">UNKNOWN</div>`;
        if (PoliceJobs[unit.unitType] !== undefined) {
          if (unit.unitType == "police"){ 
            policeCount++;
            activeInfoJob = `<div class="unit-job active-info-job-lspd">LSPD</div>`;
          }
          else if (unit.unitType=="bcso"){
            bcsoCount++;
            activeInfoJob = `<div class="unit-job active-info-job-bcso">BCSO</div>`;
          }
          
        } else if (AmbulanceJobs[unit.unitType] !== undefined) {
          activeInfoJob = `<div class="unit-job active-info-job-ambulance">EMS</div>`
          emsCount++;
        /* } else if  (DojJobs[unit.unitType] !== undefined) {
          activeInfoJob = `<div class="unit-job active-info-job-fire">FIRE</div>`
          fireCount++; */
        } else if (DojJobs[unit.unitType] !== undefined) {
          activeInfoJob = `<div class="unit-job active-info-job-doj">DOJ</div>`
          dojCount++;
        }

        unitListHTML += `
                    <div class="active-unit-item" data-id="${unit.cid}">
                        <div class="unit-status ${statusColor}">${status}</div>
                        ${activeInfoJob}
                        <div class="unit-subdiv">(${subdivision})</div>
                        <div class="unit-name">(${callSign}) ${unit.firstName} ${unit.lastName}</div>
                        <div class="unit-radio" style="background-color: ${radioBack};">${radio}</div>
                    </div>
                `;
      });

      $(".active-unit-list").html(unitListHTML)


      $("#police-count").html(policeCount);
      $("#bcso-count").html(bcsoCount);
      $("#ems-count").html(emsCount);

      //$("#doj-count").html(dojCount);
     // $("#fire-count").html(fireCount);

    /* } else if (eventData.type == "bulletin") {
      $(".bulletin-items-continer").empty();
      $.each(eventData.data, function (index, value) {
        $(
          ".bulletin-items-continer"
        ).prepend(`<div class="bulletin-item" data-id=${value.id}>
                <div class="bulletin-item-title">${value.title}</div>
                <div class="bulletin-item-info">${value.desc}</div>
                <div class="bulletin-bottom-info">
                    <div class="bulletin-id">ID: ${value.id}</div>
                    <div class="bulletin-date">${value.author
          } - ${timeAgo(Number(value.time))}</div>
                </div>
                </div>`);
      }); */
   
      $(".bulletin-items-continer")
        .find("[data-id='" + eventData.data + "']")
        .remove();
    } else if (eventData.type == "lawyersData") {


      let lawyerCount = 0;
      let judgeCount = 0;

      let lawyers = eventData.lawyers;
      let judges = eventData.judges;

      $(".doj-lawyers-unit-list").empty();
      let unitListHTML = '';

      lawyers = Object.values(lawyers)
      lawyers.forEach((unit) => {
        let status = unit.duty == 1 ? "10-8" : '10-7';
        let statusColor = unit.duty == 1 ? "green-status" : 'yellow-status';
        let callSign = unit.callSign ? unit.callSign : "000";


        let activeInfoJob = `<div class="unit-job active-info-job-lawyer">Lawyer</div>`;
        lawyerCount++;
        console.log("this lawyer num is ", unit.phonenumber);
        unitListHTML += `
                    <div class="active-unit-item" data-phonenumber="${unit.phonenumber}" data-name="${unit.firstName} ${unit.lastName}"data-id="${unit.cid}">
                        <div class="unit-status ${statusColor}">${status}</div>
                        ${activeInfoJob}
                        <div class="unit-name">(${callSign}) ${unit.firstName} ${unit.lastName}</div>
                    </div>
                `;
      });

      judges = Object.values(judges)
      judges.forEach((unit) => {
        let status = unit.duty == 1 ? "10-8" : '10-7';
        let statusColor = unit.duty == 1 ? "green-status" : 'yellow-status';
        let callSign = unit.callSign ? unit.callSign : "000";


        let activeInfoJob = `<div class="unit-job active-info-job-judge">Judge</div>`;
        judgeCount++;

        unitListHTML += `
                    <div class="active-unit-item" data-id="${unit.cid}">
                        <div class="unit-status ${statusColor}">${status}</div>
                        ${activeInfoJob}
                        <div class="unit-name">(${callSign}) ${unit.firstName} ${unit.lastName}</div>
                    </div>
                `;
      });

      $(".doj-lawyers-unit-list").html(unitListHTML)


      $("#judge-count").html(judgeCount);
      $("#lawyer-count").html(lawyerCount);
      
    } else if (eventData.type == "prisonersData") {

      let prisonerCount = 0;
      let probationCount = 0;

      let prisoners = eventData.prisoners;
      let probations = eventData.probations;

      $(".doj-prisoners-list").html(' ');
      $(".doj-probation-list").html(' ');
      let unitListHTML = '';
      let probationUnitListHTML = '';

      prisoners = Object.values(prisoners)
      prisoners.forEach((unit) => {

        let activeInfoJob = `<div class="unit-job active-info-job-prison">Imprisoned</div>`;
        prisonerCount++;

        unitListHTML += `
                    <div class="active-unit-item" data-id="${unit.cid}">
                        ${activeInfoJob}
                        <div class="unit-name">(Sentence: ${unit.time}) ${unit.firstName} ${unit.lastName}</div>
                    </div>
                `;
      });

      
      probations = Object.values(probations)
      probations.forEach((unit) => {

        let activeInfoJob = `<div class="unit-job active-info-job-probation">Probation</div>`;
        probationCount++;

        probationUnitListHTML += `
                    <div class="active-unit-item" data-id="${unit.cid}">
                        ${activeInfoJob}
                        <div class="unit-name">${unit.firstName} ${unit.lastName}</div>
                    </div>
                `;
      });


      $(".doj-prisoners-list").html(unitListHTML)
      $("#prisoner-count").html(prisonerCount);

      $(".doj-probation-list").html(probationUnitListHTML)
      $("#probation-count").html(probationCount);
      
    } else if (eventData.type == "allWarrants") {
      $(".doj-warrants-list").empty();
      $.each(eventData.data, function (index, value) {
        
        let warrantDuration = Number(value.duration);

        //start date plus hours = end date
        var hoursLeft = new Date(Number(value.time)+Number(warrantDuration)*60*60*1000);
        hoursLeft = (hoursLeft - Date.now())/36e5;
        var expiredBool = hoursLeft<0;

        let recentlySeenState = "unset";
        if(!value.online){
          recentlySeenState="none";
        }

        var element = `<div class="doj-warrants-item" data-state=${value.state} data-expired=${expiredBool} data-id=${value.id} data-cid=${value.cid} data-inc=${value.linkedincident} data-rep=${value.linkedincident}>
        <div style="display: flex; flex-direction: row; margin-top: 2.5px; margin-left: 0.75vh; width: 100%;">
            <span style="display: flex; flex-direction:column">
               <div style="display: flex; flex-direction: column;">
                  <div class="warrant-title">${value.name} <span style="margin-top: 0vh; margin-left:1vh; height:0vh; display:${recentlySeenState}" class="recently-seen">
                    <span class="dot"></span> Recently Seen
                    </span>
                  </div>  
                 
                </div>
                `;
                if(value.state===0){
                  element+=`<div class="warrant-state" style="color:orange;">Pending</div>`
                }
                if(value.state===1){
                  element+=`<div class="warrant-state" style="color:rgb(47, 193, 74);">Approved</div>`
                }
              element+= `
              <div class="warrant-bottom-info">`;
              if (value.linkedincident!=undefined){
                element+= `<div class="warrant-id">Incident ID: ${value.linkedincident}</div>`;
              }
              if (value.linkedreport!=undefined){
                element+= `<div class="warrant-id">Report ID: ${value.linkedreport}</div>`;
              }

              var timeElement;

              if(hoursLeft<24 && hoursLeft>0){
                timeElement= `</div><div class="warrant-time">Expires Today (${Math.round(hoursLeft)})</div>`;
              }
              if (hoursLeft>24){
                timeElement= `</div><div class="warrant-time">Time left: ${Math.round(hoursLeft)}</div>`;
              }
              if(hoursLeft<=0){
                timeElement= `</div><div style="color:red;" class="warrant-time">EXPIRED</div>`;
              }
              element+=timeElement;
              

              element+=`
              </span>
              </div>
              <img src="${value.pp}" class="warrant-image">
              
             
          
        </div>`;


      $('.doj-warrants-list').prepend(element);
      });

    
    } else if (eventData.type == "allWarrantsDashboard") {
      $(".warrants-items").empty();
      $.each(eventData.data, function (index, value) {
        if(value.state===1){
          var element = `<div class="warrants-item" data-warrantid=${value.id} data-cid=${value.cid} data-id=${value.linkedincident}>
          <div style="display: flex; flex-direction: row; margin-top: 2.5px; margin-left: 0.75vh; width: 100%;">
              <span style="display: flex; flex-direction:column">
                 <div style="display: flex; flex-direction: column;">
                  <div class="warrant-title">${value.name}</div>
                </div>
                <div class="warrant-bottom-info">`;
                if (value.linkedincident!=undefined){
                  element+= `<div class="warrant-id">Incident ID: ${value.linkedincident}</div>`;
                }
                if (value.linkedreport!=undefined){
                  element+= `<div class="warrant-id">Report ID ${value.linkedreport}</div>`;
                }
                    
                element+=`
                </div>  
              </span>
             
              
  
             
          </div>
          <img src="${value.pp}" class="warrant-image">
        </div>`;
  
        $('.warrants-items').prepend(element);
        }
      
    })
    } else if (eventData.type == "dispatchmessages") {
      const table = eventData.data;
      LastName = "";
      DispatchNum = 0;
      $(".dispatch-items").empty();
      $.each(table, function (index, value) {
        DispatchNum = DispatchNum + 1;
        if (LastName == value.name) {
          $(".dispatch-items").append(`
                    <div class="dispatch-item-grid dispatch-item-msg">
                        <div class="dispatch-item-message" data-author="${value.name}">${value.message}</div>
                    </div>
                    `);
        } else {
          if (DispatchNum == 1) {
            $(".dispatch-items")
              .append(`<div class="dispatch-item" style="display: flex; margin-top: 0vh;" >
                        <img src="${value.profilepic
                }" class="dispatch-message-profilepic">
                        <div class="dispatch-item-grid">
                            <div class="dispatch-item-info dispatch-info-job-${value.job
                }"> ${value.name
                } <span style="color:#969696; margin-left: 0.5vh; font-size: 12px; font-weight: normal;">${timeAgo(
                  Number(value.time)
                )}</span> </div>
                            <div class="dispatch-item-message" data-author="${value.name
                }">${value.message}</div>
                        </div>
                        </div>`);
          } else {
            $(".dispatch-items")
              .append(`<div class="dispatch-item" style="display: flex;" >
                        <img src="${value.profilepic
                }" class="dispatch-message-profilepic">
                        <div class="dispatch-item-grid">
                            <div class="dispatch-item-info dispatch-info-job-${value.job
                }"> ${value.name
                } <span style="color:#969696; margin-left: 0.5vh; font-size: 12px; font-weight: normal;">${timeAgo(
                  Number(value.time)
                )}</span> </div>
                            <div class="dispatch-item-message" data-author="${value.name
                }">${value.message}</div>
                        </div>
                        </div>`);
          }
        }
        LastName = value.name;
        $(".dispatch-items").scrollTop(
          $(".dispatch-items")[0].scrollHeight
        );
      });
      $(".dispatch-items").scrollTop(
        $(".dispatch-items")[0].scrollHeight
      );
    } else if (eventData.type == "dispatchmessage") {
      const value = eventData.data;
      DispatchNum = DispatchNum + 1;
      const BodyDisplay = $("body").css("display");
      if (BodyDisplay == "block") {
        if (LastName == value.name) {
          $(".dispatch-items").append(`
                    <div class="dispatch-item-grid dispatch-item-msg">
                        <div class="dispatch-item-message" data-author="${value.name}">${value.message}</div>
                    </div>
                    `);
        } else {
          if (DispatchNum == 1) {
            $(".dispatch-items")
              .append(`<div class="dispatch-item" style="display: flex; margin-top: 0vh;" >
                        <img src="${value.profilepic
                }" class="dispatch-message-profilepic">
                        <div class="dispatch-item-grid">
                            <div class="dispatch-item-info dispatch-info-job-${value.job
                }"> ${value.name
                } <span style="color:#969696; margin-left: 0.5vh; font-size: 12px; font-weight: normal;">${timeAgo(
                  Number(value.time)
                )}</span> </div>
                            <div class="dispatch-item-message" data-author="${value.name
                }">${value.message}</div>
                        </div>
                        </div>`);
          } else {
            $(".dispatch-items")
              .append(`<div class="dispatch-item" style="display: flex;" >
                        <img src="${value.profilepic
                }" class="dispatch-message-profilepic">
                        <div class="dispatch-item-grid">
                            <div class="dispatch-item-info dispatch-info-job-${value.job
                }"> ${value.name
                } <span style="color:#969696; margin-left: 0.5vh; font-size: 12px; font-weight: normal;">${timeAgo(
                  Number(value.time)
                )}</span> </div>
                            <div class="dispatch-item-message" data-author="${value.name
                }">${value.message}</div>
                        </div>
                        </div>`);
          }
        }
        LastName = value.name;
      } else if (BodyDisplay == "none") {
        $.post(
          `https://${GetParentResourceName()}/dispatchNotif`,
          JSON.stringify({
            data: value,
          })
        );
      }
      $(".dispatch-items").scrollTop(
        $(".dispatch-items")[0].scrollHeight
      );
    } else if (eventData.type == "call") {
      const value = eventData.data;
      if (value && value.job.includes(playerJob)) {
        let foundAttached = false;

        let playerAttachedState = "none";
        let activecallitemcssPosition = "";
        let activecallitemcssMarginTop = "";
        let activecallitemcssWidth = "";
        let activecallitemcssBackgroundColor = "#162738";
        if (value.callId == attachedCallsIDs[0]){
          foundAttached=true;
          playerAttachedState = "unset";
          activecallitemcssPosition = "absolute";
          activecallitemcssMarginTop = "-110px";
          activecallitemcssWidth = "47.5vh";
          activecallitemcssBackgroundColor = "#5597D9";
        }

        let DispatchItem = `<div style="position:${activecallitemcssPosition}; margin-top:${activecallitemcssMarginTop}; width: ${activecallitemcssWidth}; background-color:${activecallitemcssBackgroundColor};" class="active-calls-item" data-id="${value.callId}" data-canrespond="false"><div class="active-call-inner-container"><div class="call-item-top"><div class="call-number">#${value.callId}</div><div class="call-code priority-${value.priority}">${value.dispatchCode}</div><div class="call-title">${value.dispatchMessage}</div><div style="display:${playerAttachedState}" class="player-attached"><span class="dot"></span> Attached</div><div class="call-radio">${value.units.length}</div></div><div class="call-item-bottom">`;

        if (
          value.dispatchCode == "911" ||
          value.dispatchCode == "311"
        ) {
          DispatchItem = `<div class="active-calls-item" data-id="${value.callId}" data-canrespond="true"><div class="active-call-inner-container"><div class="call-item-top"><div class="call-number">#${value.callId}</div><div class="call-code priority-${value.priority}">${value.dispatchCode}</div><div class="call-title">${value.dispatchMessage}</div><div style="display:${playerAttachedState}" class="player-attached"><span class="dot"></span> Attached</div><div class="call-radio">${value.units.length}</div></div><div class="call-item-bottom">`;
        }

        if (value["time"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-clock"></span>${timeAgo(
            value.time
          )}</div>`;
        }

        if (value["firstStreet"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-map-pin"></span>${value.firstStreet}</div>`;
        }

        if (value["callsign"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-compass"></span>${value.callsign}</div>`;
        }

        if (value["doorCount"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-door-open"></span>${value.doorCount}</div>`;
        }

        if (value["speed"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-arrow-right"></span>${value.speed}</div>`;
        }

        if (value["weapon"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-bullseye"></span>${value.weapon}</div>`;
        }

        if (value["heading"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-share"></span>${value.heading}</div>`;
        }

        if (value["gender"]) {
          let gender = "Male";
          if (value["gender"] == 0 || value["gender"] == 2) {
            gender = "Female";
          }
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-genderless"></span>${gender}</div>`;
        }

        if (value["model"] && value["plate"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-car"></span>${value["model"]}<span class="fas fa-digital-tachograph" style="margin-left: 2vh;"></span>${value["plate"]}</div>`;
        } else if (value["plate"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-digital-tachograph"></span>${value["plate"]}</div>`;
        } else if (value["model"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-car"></span>${value["model"]}</div>`;
        }

        if (value["firstColor"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-spray-can"></span>${value["firstColor"]}</div>`;
        }

        if (value["automaticGunfire"] == true) {
          DispatchItem += `<div class="call-bottom-info"><span class="fab fa-blackberry"></span>Automatic Gunfire</div>`;
        }

        if (value["name"] && value["number"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="far fa-id-badge"></span>${value["name"]}<span class="fas fa-mobile-alt" style="margin-left: 2vh;"></span>${value["number"]}</div>`;
        } else if (value["number"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="fas fa-mobile-alt"></span>${value["number"]}</div>`;
        } else if (value["name"]) {
          DispatchItem += `<div class="call-bottom-info"><span class="far fa-id-badge"></span>${value["name"]}</div>`;
        }

        if (value["information"]) {
          DispatchItem += `<div class="call-bottom-info call-bottom-information"><span class="far fa-question-circle"></span>${value["information"]}</div>`;
        }

        DispatchItem += `</div></div></div>`;

        if (
          value.dispatchCode == "911" ||
          value.dispatchCode == "311"
        ){
          $(".active-phonecalls-list").prepend(
            $(DispatchItem).hide().fadeIn("slow")
          );
        }
        else{
          $(".active-calls-list").prepend(
            $(DispatchItem).hide().fadeIn("slow")
          );
        }
        
        if (foundAttached){
          
          $(".active-calls-list").css("margin-top", "120px");
        }
        else{
          $(".active-calls-list").css("margin-top", "10px");
        }

      }
    } else if (eventData.type == "attachedUnits") {
      const table = eventData.data;
      if (table) {
        $(".dispatch-attached-units").fadeIn(0);
        $(".dispatch-attached-units-container").fadeIn(250);
        $(".close-all").css("filter", "brightness(15%)");
        $(".dispatch-attached-units-holder").empty();
        $.each(table, function (index, value) {
          $(
            ".dispatch-attached-units-holder"
          ).prepend(`<div class="dispatch-attached-unit-item" data-id="${value.cid}">
                        <div class="unit-job unit-police">${value.job}</div>
                        <div class="unit-name">(${value.callsign}) ${value.fullname}</div>
                        <div class="unit-radio">1</div>
                    </div> `);
        });
        setTimeout(() => {
          $(".dispatch-attached-units-container").attr(
            "id",
            eventData.callid
          );
        }, 1000);
      }
    } else if (eventData.type == "sendCallResponse") {
      if ($(".respond-calls-container").data("id") == eventData.callid) {
        $(".respond-calls-responses").prepend(
          `<div class="respond-calls-response"> ${eventData["name"]
          } responded "${eventData["message"]}" - ${timeAgo(
            Number(eventData.time)
          )}. </div>`
        );
      }
    } else if (eventData.type == "getCallResponses") {
      const table = eventData.data;
      $(".respond-calls").fadeIn(0);
      $(".respond-calls-container").fadeIn(250);
      $(".close-all").css("filter", "brightness(15%)");
      $("#respondcalls").val("");
      $(".respond-calls-responses").empty();
      setTimeout(() => {
        $(".respond-calls-container").data("id", eventData.callid);
      }, 1000);
      $.each(table, function (index, value) {
        $(".respond-calls-responses").prepend(
          `<div class="respond-calls-response"> ${value["name"]
          } responded "${value["message"]}" - ${timeAgo(
            Number(value.time)
          )}. </div>`
        );
      });
    } else if (eventData.type == "calls") {
      const table = eventData.data;
      //there is an attached call
      $(".active-calls-list").empty();
      $(".active-phonecalls-list").empty();
      var thereAttachedCall = false;
      $.each(table, function (index, value) {
        if (value && value.job.includes(playerJob)) {

          let playerAttachedState = "none";
          let activecallitemcssPosition = "";
          let activecallitemcssMarginTop = "";
          let activecallitemcssWidth = "";
          let activecallitemcssBackgroundColor = "#162738";
          if (value.callId == attachedCallsIDs[0]){
            playerAttachedState = "unset";
            activecallitemcssPosition = "absolute";
            activecallitemcssMarginTop = "-110px";
            activecallitemcssWidth = "47.5vh";
            activecallitemcssBackgroundColor = "#5597D9";

            thereAttachedCall=true;
          }
  
          let DispatchItem = `<div style="position:${activecallitemcssPosition}; margin-top:${activecallitemcssMarginTop}; width: ${activecallitemcssWidth}; background-color:${activecallitemcssBackgroundColor};" class="active-calls-item" data-id="${value.callId}" data-canrespond="false"><div class="active-call-inner-container"><div class="call-item-top"><div class="call-number">#${value.callId}</div><div class="call-code priority-${value.priority}">${value.dispatchCode}</div><div class="call-title">${value.dispatchMessage}</div><div style="display:${playerAttachedState}" class="player-attached"><span class="dot"></span> Attached</div><div class="call-radio">${value.units.length}</div></div><div class="call-item-bottom">`;
  
          if (
            value.dispatchCode == "911" ||
            value.dispatchCode == "311"
          ) {
            DispatchItem = `<div class="active-calls-item" data-id="${value.callId}" data-canrespond="true"><div class="active-call-inner-container"><div class="call-item-top"><div class="call-number">#${value.callId}</div><div class="call-code priority-${value.priority}">${value.dispatchCode}</div><div class="call-title">${value.dispatchMessage}</div><div style="display:${playerAttachedState}" class="player-attached"><span class="dot"></span> Attached</div><div class="call-radio">${value.units.length}</div></div><div class="call-item-bottom">`;
          }

          if (value["time"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-clock" style="margin-left: -0.1vh;"></span>${timeAgo(
              value.time
            )}</div>`;
          }

          if (value["firstStreet"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-map-pin"></span>${value.firstStreet}</div>`;
          }

          if (value["heading"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-share"></span>${value.heading}</div>`;
          }

          if (value["gender"]) {
            let gender = "Male";
            if (value["gender"] == 0 || value["gender"] == 2) {
              gender = "Female";
            }
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-genderless"></span>${gender}</div>`;
          }

          if (value["model"] && value["plate"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-car"></span>${value["model"]}<span class="fas fa-digital-tachograph" style="margin-left: 2vh;"></span>${value["plate"]}</div>`;
          } else if (value["plate"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-digital-tachograph"></span>${value["plate"]}</div>`;
          } else if (value["model"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-car"></span>${value["model"]}</div>`;
          }

          if (value["firstColor"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-spray-can"></span>${value["firstColor"]}</div>`;
          }

          if (value["automaticGunfire"] == true) {
            DispatchItem += `<div class="call-bottom-info"><span class="fab fa-blackberry"></span>Automatic Gunfire</div>`;
          }

          if (value["name"] && value["number"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="far fa-id-badge"></span>${value["name"]}<span class="fas fa-mobile-alt" style="margin-left: 2vh;"></span>${value["number"]}</div>`;
          } else if (value["number"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="fas fa-mobile-alt"></span>${value["number"]}</div>`;
          } else if (value["name"]) {
            DispatchItem += `<div class="call-bottom-info"><span class="far fa-id-badge"></span>${value["name"]}</div>`;
          }

          if (value["information"]) {
            DispatchItem += `<div class="call-bottom-info call-bottom-information"><span class="far fa-question-circle"></span>${value["information"]}</div>`;
          }

          DispatchItem += `</div></div></div>`;
          if (
            value.dispatchCode == "911" ||
            value.dispatchCode == "311"
          ){
            
            $(".active-phonecalls-list").prepend(
              $(DispatchItem).hide().fadeIn("slow")
            );
          }
          else{
            $(".active-calls-list").prepend(
              $(DispatchItem).hide().fadeIn("slow")
            );
          }

        }
      });
      if (thereAttachedCall){
        $(".active-calls-list").css("margin-top", "120px");
      }
      else{
        $(".active-calls-list").css("margin-top", "10px");
      }
       

    } else if (eventData.type == "incidents") {
      let table = eventData.data;
      canSearchForProfiles = true;
      $(".incidents-items").empty();
      $.each(table, function (index, value) {
        $(".incidents-items").append(
          `<div class="incidents-item" data-author="${value.author}" data-id="${value.id}">
                    <div class="incidents-top-holder">
                        <div class="incidents-item-title">${value.title}</div>
                        <div class="incedent-report-name">Incident Report</div>
                    </div>
                    <div class="incidents-bottom-holder">
                        <div class="incedent-report-id">ID: ${value.id}</div>
                        <div class="incedent-report-time-ago">${value.author
          } - ${timeAgo(Number(value.time))}</div>
                    </div>
                </div>`
        );
      });
    } else if (eventData.type == "warrants") {

      canSearchForWarrants = true;
      $(".doj-warrants-list").empty();
      $.each(eventData.data, function (index, value) {
        
        let warrantDuration = Number(value.duration);

        //start date plus hours = end date
        var hoursLeft = new Date(Number(value.time)+Number(warrantDuration)*60*60*1000);
        hoursLeft = (hoursLeft - Date.now())/36e5;
        var expiredBool = hoursLeft<0;

        let recentlySeenState = "unset";
        if(!value.online){
          recentlySeenState="none";
        }

        var element = `<div class="doj-warrants-item" data-state=${value.state} data-expired=${expiredBool} data-id=${value.id} data-cid=${value.cid} data-inc=${value.linkedincident} data-rep=${value.linkedincident}>
        <div style="display: flex; flex-direction: row; margin-top: 2.5px; margin-left: 0.75vh; width: 100%;">
            <span style="display: flex; flex-direction:column">
               <div style="display: flex; flex-direction: column;">
                  <div class="warrant-title">${value.name} <span style="margin-top: 0vh; margin-left:1vh; height:0vh; display:${recentlySeenState}" class="recently-seen">
                    <span class="dot"></span> Recently Seen
                    </span>
                  </div>  
                 
                </div>
                `;
                if(value.state===0){
                  element+=`<div class="warrant-state" style="color:orange;">Pending</div>`
                }
                if(value.state===1){
                  element+=`<div class="warrant-state" style="color:rgb(47, 193, 74);">Approved</div>`
                }
              element+= `
              <div class="warrant-bottom-info">`;
              if (value.linkedincident!=undefined){
                element+= `<div class="warrant-id">Incident ID: ${value.linkedincident}</div>`;
              }
              if (value.linkedreport!=undefined){
                element+= `<div class="warrant-id">Report ID: ${value.linkedreport}</div>`;
              }

              var timeElement;

              if(hoursLeft<24 && hoursLeft>0){
                timeElement= `</div><div class="warrant-time">Expires Today (${Math.round(hoursLeft)})</div>`;
              }
              if (hoursLeft>24){
                timeElement= `</div><div class="warrant-time">Time left: ${Math.round(hoursLeft)}</div>`;
              }
              if(hoursLeft<=0){
                timeElement= `</div><div style="color:red;" class="warrant-time">EXPIRED</div>`;
              }
              element+=timeElement;
              

              element+=`
              </span>
              </div>
              <img src="${value.pp}" class="warrant-image">
              
             
          
        </div>`;


      $('.doj-warrants-list').prepend(element);
      });


    } else if (eventData.type == "getPenalCode") {
      const titles = eventData.titles;
      const penalcode = eventData.penalcode;
      $(".offenses-main-container").empty();
      $.each(titles, function (index, value) {
        $(".offenses-main-container").append(
          `<div class="offenses-title-container">
                        <div class="offenses-title">${value}</div>
                    </div>
                    <div class="offenses-container offenses-prepend-holder" id="penal-${index}">
                    </div>
                    `
        );
      });
      $.each(penalcode, function (index, value) {
        $.each(value, function (i, v) {
          $(`#penal-${index}`).append(`
                    <div class="offense-item ${v.color}-penis-code" data-sentence="${v.months}" data-fine="${v.fine}">
                    <div style="display: flex; flex-direction: row; width: 100%; margin: auto; margin-top: 0vh;">
                        <div class="offense-item-offense">${v.title}</div>
                        <div class="offfense-item-name">${v.class}</div>
                    </div>
                    <div style="display: flex; flex-direction: row; width: 100%; margin: auto; margin-bottom: 0vh; padding-top: 0.75vh;">
                        <div class="offense-item-id">${v.id}</div>
                        <div class="offfense-item-months">${v.months} Months - $${v.fine}</div>
                    </div>
                    `);
        });
      });
    } else if (eventData.type == "incidentData") {
      let table = eventData.data;

      $(".incidents-ghost-holder").html("");
      $(".associated-incidents-tags-holder").html("");

      $(".manage-incidents-editing-title").html(
        "You are currently editing incident " + table["id"]
      );
      $(".manage-incidents-editing-title").data(
        "id",
        Number(table["id"])
      );

      $(".manage-incidents-tags-add-btn").css("pointer-events", "auto");
      $(".manage-incidents-reports-content").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-officers-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-civilians-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-evidence-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".associated-incidents-tags-add-btn").css(
        "pointer-events",
        "auto"
      );

      $("#manage-incidents-title-input").val(table["title"]);
      $(".manage-incidents-reports-content").val(table["details"]);

      $(".manage-incidents-tags-holder").empty();
      $.each(table["tags"], function (index, value) {
        $(".manage-incidents-tags-holder").append(
          `<div class="manage-incidents-tag tag">${value}</div>`
        );
      });

      $(".manage-incidents-officers-holder").empty();
      $.each(table["officersinvolved"], function (index, value) {
        $(".manage-incidents-officers-holder").append(
          `<div class="manage-incidents-officers">${value}</div>`
        );
      });

      $(".manage-incidents-civilians-holder").empty();
      $.each(table["civsinvolved"], function (index, value) {
        $(".manage-incidents-civilians-holder").append(
          `<div class="manage-incidents-civilians">${value}</div>`
        );
      });

      $(".manage-incidents-evidence-holder").empty();
      $.each(table["evidence"], function (index, value) {
        $(".manage-incidents-evidence-holder").append(
          `<img class="incidents-img" src=${value}>`
        );
      });

      $(".manage-incidents-title-holder").empty();
      if (PoliceJobs[playerJob] !== undefined || AmbulanceJobs[playerJob] !== undefined) {
        $(".manage-incidents-title-holder").prepend(
          `
            <div class="manage-incidents-title">Manage Incident</div>
            <div class="manage-incidents-create"> <span class="fas fa-plus" style="margin-top: 3.5px;"></span></div>
            <div class="manage-incidents-save"><span class="fas fa-save" style="margin-top: 3.5px;"></span></div>
            `
        );
        $(".manage-incidents-title").css("width", "66%");
        $(".manage-incidents-create").css("margin-right", "0px");
      } else if (DojJobs[playerJob] !== undefined) {
        $(".manage-incidents-title-holder").prepend(
          `
            <div class="manage-incidents-title">Manage Incident</div>
            `
        );
        $(".manage-incidents-title").css("width", "95%");
      }

      let associateddata = eventData.convictions;
      $.each(associateddata, function (index, value) {
        $(".associated-incidents-tags-holder").prepend(
          `<div class="associated-incidents-tag" data-id="${value.cid}">${value.name}</div>`
        );

        var probationTag = "red-tag";
        var guiltyTag = "red-tag";
        var processedTag = "red-tag";
        var associatedTag = "red-tag";


        if (value.guilty == 1) {
          guiltyTag = "green-tag";
        }
        if (value.processed == 1) {
          processedTag = "green-tag";
        }
        if (value.associated == 1) {
          associatedTag = "green-tag";
        }
        if (value.probation == 1) {
          probationTag = "green-tag";
        }
        

        const cid = value.cid;
        if (value.associated == 1) {
          $(".incidents-ghost-holder").prepend(
            `<div class="associated-incidents-user-container" data-id="${value.cid}">
                            <div class="associated-incidents-user-title">${value.name} (#${value.cid})</div>
                            <div class="associated-incidents-user-tags-holder">
                                <div class="associated-incidents-user-tag ${probationTag}" data-id="${value.cid}">Probation</div>
                                <div class="associated-incidents-user-tag ${guiltyTag}" data-id="${value.cid}">Guilty</div>
                                <div class="associated-incidents-user-tag ${processedTag}" data-id="${value.cid}">Processed</div>
                                <div class="associated-incidents-user-tag ${associatedTag}" data-id="${value.cid}">Associated</div>
                            </div>
                            <div class="associated-incidents-user-holder" data-name="${value.cid}" style="display:none;">
                            </div>
                            <div class="addCharge-btn" data-id="${value.cid}">Add Charge</div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}" style="display:none;">Recommended Fine</div>
                            <div class="associated-incidents-fine-input" data-id="${value.cid}" style="display:none;"><img src="https://i.imgur.com/h7S5f9J.png"> <input placeholder="0" disabled class="fine-recommended-amount" id="fine-recommended-amount" data-id="${value.cid}" type="number"></div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}" style="display:none;">Recommended Sentence</div>
                            <div class="associated-incidents-sentence-input" data-id="${value.cid}" style="display:none;"><img src="https://i.imgur.com/9Xn6xXK.png"> <input placeholder="0" disabled class="sentence-recommended-amount" id="sentence-recommended-amount" data-id="${value.cid}" type="number"></div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}" style="display:none;">Fine</div>
                            <div class="associated-incidents-fine-input" data-id="${value.cid}" style="display:none;"><img src="https://i.imgur.com/h7S5f9J.png"> <input placeholder="Enter fine here..." value="0" class="fine-amount" data-id="${value.cid}" type="number"></div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}" style="display:none;">Sentence</div>
                            <div class="associated-incidents-sentence-input" data-id="${value.cid}" style="display:none;"><img src="https://i.imgur.com/9Xn6xXK.png"> <input placeholder="Enter months here..." value="0" class="sentence-amount" data-id="${value.cid}" type="number"></div>
                        </div>`
          );
        } else {
          $(".incidents-ghost-holder").prepend(
            `<div class="associated-incidents-user-container" data-id="${value.cid}">
                            <div class="associated-incidents-user-title">${value.name} (#${value.cid})</div>
                            <div class="associated-incidents-user-tags-holder">
                                <div class="associated-incidents-user-tag ${probationTag}" data-id="${value.cid}">Probation</div>
                                <div class="associated-incidents-user-tag ${guiltyTag}" data-id="${value.cid}">Guilty</div>
                                <div class="associated-incidents-user-tag ${processedTag}" data-id="${value.cid}">Processed</div>
                                <div class="associated-incidents-user-tag ${associatedTag}" data-id="${value.cid}">Associated</div>
                            </div>
                            <div class="associated-incidents-user-holder" data-name="${value.cid}">
                            </div>
                            <div class="addCharge-btn" data-id="${value.cid}">Add Charge</div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}">Recommended Fine</div>
                            <div class="associated-incidents-fine-input" data-id="${value.cid}"><img src="https://i.imgur.com/h7S5f9J.png"> <input placeholder="0" disabled class="fine-recommended-amount" id="fine-recommended-amount" data-id="${value.cid}" type="number"></div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}">Recommended Sentence</div>
                            <div class="associated-incidents-sentence-input" data-id="${value.cid}"><img src="https://i.imgur.com/9Xn6xXK.png"> <input placeholder="0" disabled class="sentence-recommended-amount" id="sentence-recommended-amount" data-id="${value.cid}" type="number"></div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}">Fine</div>
                            <div class="associated-incidents-fine-input" data-id="${value.cid}"><img src="https://i.imgur.com/h7S5f9J.png"> <input placeholder="Enter fine here..." value="0" class="fine-amount" data-id="${value.cid}" type="number"></div>
                            <div class="manage-incidents-title-tag" data-id="${value.cid}">Sentence</div>
                            <div class="associated-incidents-sentence-input" data-id="${value.cid}"><img src="https://i.imgur.com/9Xn6xXK.png"> <input placeholder="Enter months here..." value="0" class="sentence-amount" data-id="${value.cid}" type="number"></div>
                        </div>`
          );
        }

        $(".fine-amount")
          .filter("[data-id='" + value.cid + "']")
          .val(value.fine);

        $(".sentence-amount")
          .filter("[data-id='" + value.cid + "']")
          .val(value.sentence);

        $(".fine-recommended-amount")
          .filter("[data-id='" + value.cid + "']")
          .val(value.recfine);

        $(".sentence-recommended-amount")
          .filter("[data-id='" + value.cid + "']")
          .val(value.recsentence);

        const charges = value["charges"];
        for (var i = 0; i < charges.length; i++) {
          const randomNum = Math.ceil(
            Math.random() * 1000
          ).toString();
          $(`[data-name="${cid}"]`).prepend(
            `<div class="white-tag" data-link="${randomNum}" data-id="${cid}">${charges[i]}</div>`
          );
        }
      });
    } else if (eventData.type == "incidentSearchPerson") {
      let table = eventData.data;
      $(".icidents-person-search-holder").empty();
      $.each(table, function (index, value) {
        let name = value.firstname + " " + value.lastname;
        $(".icidents-person-search-holder").prepend(
          `
                    <div class="icidents-person-search-item" data-info="${name} (#${value.id})" data-cid="${value.id}" data-name="${name}">
                        <img src="${value.profilepic}" class="icidents-person-search-item-pfp">
                        <div class="icidents-person-search-item-right">
                            <div class="icidents-person-search-item-right-cid-title">Citizen ID</div>
                            <div class="icidents-person-search-item-right-cid-input"><span class="fas fa-id-card"></span> ${value.id}</div>
                            <div class="icidents-person-search-item-right-name-title">Name</div>
                            <div class="icidents-person-search-item-right-name-input"><span class="fas fa-user"></span> ${name}</div>
                        </div>
                    </div>
                    `
        );
      });
    } else if (eventData.type == "newwarrantSearchPerson") {
      let table = eventData.data;
      $(".newwarrants-person-search-holder").empty();
      $.each(table, function (index, value) {
        let name = value.firstname + " " + value.lastname;
        $(".newwarrants-person-search-holder").prepend(
          `
                    <div class="newwarrants-person-search-item" data-info="${name} (#${value.id})" data-cid="${value.id}" data-name="${name}">
                        <img src="${value.profilepic}" class="newwarrants-person-search-item-pfp">
                        <div class="newwarrants-person-search-item-right">
                            <div class="newwarrants-person-search-item-right-cid-title">Citizen ID</div>
                            <div class="newwarrants-person-search-item-right-cid-input"><span class="fas fa-id-card"></span> ${value.id}</div>
                            <div class="newwarrants-person-search-item-right-name-title">Name</div>
                            <div class="newwarrants-person-search-item-right-name-input"><span class="fas fa-user"></span> ${name}</div>
                        </div>
                    </div>
                    `
        );
      });
    } else if (eventData.type == "boloData") {
      let table = eventData.data;
      $(".manage-bolos-editing-title").html(
        "You are currently editing BOLO " + table["id"]
      );

      if ($(".badge-logo").attr("src") == "img/ems_badge.png") {
        $(".manage-bolos-editing-title").html(
          "You are editing ICU Check-in " + table["id"]
        );
      }

      $(".manage-bolos-editing-title").data("id", Number(table["id"]));

      $(".manage-bolos-input-title").val(table["title"]);
      $(".manage-bolos-input-plate").val(table["plate"]);
      $(".manage-bolos-input-owner").val(table["owner"]);
      $(".manage-bolos-input-individual").val(table["individual"]);

      $(".manage-bolos-reports-content").val(table["detail"]);

      $(".manage-bolos-tags-holder").empty();
      $.each(table["tags"], function (index, value) {
        $(".manage-bolos-tags-holder").prepend(
          `<div class="tag-bolo-input">${value}</div>`
        );
      });

      $(".bolo-gallery-inner-container").empty();
      $.each(table["gallery"], function (index, value) {
        let randomNum = Math.ceil(Math.random() * 10).toString();
        $(".bolo-gallery-inner-container").prepend(
          `<img src="${value}" class="bolo-img ${randomNum}" onerror="this.src='img/not-found.jpg'">`
        );
      });

      $(".manage-officers-tags-holder").empty();
      $.each(table["officersinvolved"], function (index, value) {
        $(".manage-officers-tags-holder").prepend(
          `<div class="tag">${value}</div>`
        );
      });
    } else if (eventData.type == "bolos") {
      let table = eventData.data;
      var reportName = "General BOLO";
      canSearchForProfiles = true;
      $(".bolos-items").empty();
      if ($(".badge-logo").attr("src") == "img/ems_badge.png") {
        reportName = "ICU Check-in";
      }
      $.each(table, function (index, value) {
        $(".bolos-items").prepend(
          `<div class="bolo-item" data-id="${value.id}">
                    <div class="bolo-top-holder">
                        <div class="bolo-item-title">${value.title}</div>
                        <div class="bolo-report-name">${reportName}</div>
                    </div>
                    <div class="bolo-bottom-holder">
                        <div class="bolo-report-id">ID: ${value.id}</div>
                        <div class="bolo-report-time-ago">${value.author
          } - ${timeAgo(Number(value.time))}</div>
                    </div>
                </div>`
        );
      });
    } else if (eventData.type == "boloComplete") {
      let id = eventData.data;
      if (canRefreshBolo == true) {
        canRefreshBolo = false;
        $(".bolos-search-refresh").empty();
        $(".bolos-search-refresh").prepend(
          `<span class="fas fa-spinner fa-spin"></span>`
        );
        setTimeout(() => {
          $(".bolos-search-refresh").empty();
          $(".bolos-search-refresh").html("Refresh");
          canRefreshBolo = true;
          $.post(`https://${GetParentResourceName()}/getAllBolos`, JSON.stringify({}));
        }, 1500);
      }
      $(".manage-bolos-editing-title").html(
        "You are currently editing BOLO " + id
      );
      $(".manage-bolos-editing-title").data("id", Number(id));
    } else if (eventData.type == "reportComplete") {
      let id = eventData.data;
      if (canRefreshReports == true) {
        canRefreshReports = false;
        $(".reports-search-refresh").empty();
        $(".reports-search-refresh").prepend(
          `<span class="fas fa-spinner fa-spin"></span>`
        );
        setTimeout(() => {
          $(".reports-search-refresh").empty();
          $(".reports-search-refresh").html("Refresh");
          canRefreshReports = true;
          $.post(`https://${GetParentResourceName()}/getAllReports`, JSON.stringify({}));
        }, 1500);
      }
      $(".manage-reports-editing-title").html(
        "You are currently editing report " + id
      );
      $(".manage-reports-editing-title").data("id", Number(id));
    } else if (eventData.type == "reports") {
      let table = eventData.data;
      canSearchForReports = true;
      $(".reports-items").empty();
      $.each(table, function (index, value) {
        $(".reports-items").append(
          `<div class="reports-item" data-author="${value.author}" data-id="${value.id}">
                    <div class="reports-top-holder">
                        <div class="reports-item-title">${value.title}</div>
                        <div class="reports-report-name">${value.type
          } Report</div>
                    </div>
                    <div class="reports-bottom-holder">
                        <div class="reports-report-id">ID: ${value.id}</div>
                        <div class="reports-report-time-ago">${value.author
          } - ${timeAgo(Number(value.time))}</div>
                    </div>
                </div>`
        );
      });
    } else if (eventData.type == "reportData") {
      let table = eventData.data;

      $(".manage-reports-editing-title").html(
        "You are currently editing report " + table["id"]
      );

      $(".manage-reports-editing-title").data("id", Number(table["id"]));

      $(".manage-reports-input-title").val(table["title"]);
      $(".manage-reports-input-type").val(table["type"]);
      $(".manage-reports-reports-content").val(table["details"]);

      $(".manage-reports-tags-holder").empty();
      $.each(table["tags"], function (index, value) {
        $(".manage-reports-tags-holder").append(
          `<div class="tag">${value}</div>`
        );
      });

      $(".reports-gallery-inner-container").empty();
      $.each(table["gallery"], function (index, value) {
        let randomNum = Math.ceil(Math.random() * 10).toString();
        $(".reports-gallery-inner-container").append(
          `<img src="${value}" class="reports-img ${randomNum}" onerror="this.src='img/not-found.jpg'">`
        );
      });

      $(".reports-officers-tags-holder").empty();
      $.each(table["officersinvolved"], function (index, value) {
        $(".reports-officers-tags-holder").append(
          `<div class="tag">${value}</div>`
        );
      });

      $(".reports-civilians-tags-holder").empty();
      $.each(table["civsinvolved"], function (index, value) {
        console.log("tag ", value)
        $(".reports-civilians-tags-holder").append(
          `<div class="tag">${value}</div>`
        );
      });

    } else if (eventData.type == "weaponsComplete") {
      let id = eventData.data[0];
      let newEventBool = eventData.data[1];
      if (canRefreshWeaponReg == true) {
        canRefreshWeaponReg = false;
        $(".weaponreg-search-refresh").empty();
        $(".weaponreg-search-refresh").prepend(
          `<span class="fas fa-spinner fa-spin"></span>`
        );
        setTimeout(() => {
          $(".weaponreg-search-refresh").empty();
          $(".weaponreg-search-refresh").html("Refresh");
          canRefreshWeaponReg = true;
          $.post(`https://${GetParentResourceName()}/getAllWeapons`, JSON.stringify({}));
        }, 1500);
      }
      $(".weaponreg-timeline-editing-title").html(
        "You are currently editing report " + id
      );
      $(".weaponreg-timeline-editing-title").data("id", Number(id));
    } else if (eventData.type == "warrantsComplete") {
      if (canRefreshWarrants == true) {
        canRefreshWarrants = false;
        $(".doj-warrants-search-refresh").empty();
        $(".doj-warrants-search-refresh").prepend(
          `<span class="fas fa-spinner fa-spin"></span>`
        );
        setTimeout(() => {
          $(".doj-warrants-search-refresh").empty();
          $(".doj-warrants-search-refresh").html("Refresh");
          canRefreshWarrants = true;
          $.post(`https://${GetParentResourceName()}/getAllWarrants`, JSON.stringify({}));
        }, 1500);
      }
     
    } else if (eventData.type == "warrantData") {
      let table = eventData.data;
      $.each(table, function (index, value) {
        $(".doj-warrants-title").data("warrantid", value.id);
        $('#newwarrants-personname').html(""+value.name + " | " + value.cid);
        $('.newwarrant-content').html(value.details);
        let days = 0;
        let hours = value.duration;
        while (hours>24){
          hours-=24;
          days+=1;
        }
        let dayFormat = String(days);
        if (days<10){dayFormat="0"+days;}
        let hourFormat = String(hours);
        if(hours<10){hourFormat = "0"+hours;}

        $("#newwarrant-duration-input").val(""+dayFormat+":"+hourFormat+":00:00");
        $(".doj-newwarrant-date").html(new Date(Number(value.time)));

        $("#newwarrant-incident-input").val(value.linkedincident);
        $("#newwarrant-report-input").val(value.linkedreport);

        $("#doj-warrants-publishwarrant").hide();

        if(playerJob==="judge" && value.state==0){
          $("#doj-warrants-publishwarrant").show();
          $("#doj-warrants-publishwarrant").html("Approve Warrant");
        }
        $(".doj-warrants-title").html("Viewing Warrant");


      });
     
        
     
    } else if (eventData.type == "weapons") {
      let table = eventData.data;
      canSearchForWeaponReg = true;
      $(".weaponreg-items").empty();
      $.each(table, function (index, value) {
        $(".weaponreg-items").append(
          `<div class="weaponreg-item" data-serialnumber="${value.serialnumber}">
                <div class="weaponreg-item-serialnum">Weapon Serial Number: ${value.serialnumber}</div>
            </div>`
        );
      });
    } else if (eventData.type == "weaponsData") {
      let table = eventData.data;
      //base information ---
      if (table[0]==undefined) { return; }
      var weaponSerialNum = table[0].serialnumber;
      $(".weaponreg-timeline-editing-title").html(
        "You are viewing weapon: " + weaponSerialNum + "'s history"
      );
      $(".weaponreg-timeline-editing-title").data("serialnumber", weaponSerialNum);
      
      
      $("#weaponreg-serialNumber").html(weaponSerialNum);
      $("#weaponreg-weaponName").html(weaponSerialNum);

      currentWeaponRegEvents = [];
      $('.weaponreg-timeline-content').empty();
      $.each(table, function (index, value) {
        $('.weaponreg-timeline-content').append(
          `<div class="weaponreg-timeline-event" data-id="${value.id}">
            <div class="weaponreg-timeline-event-type">
            ${value.title}</div>
            <div class="weaponreg-timeline-event-time">
             ${value.id}</div></div>`
        );

        currentWeaponRegEvents[currentWeaponRegEvents.length] = value.id;
        
        
      });
      displayWeaponRegEvent(currentWeaponRegEvents[0]); //display first event

    } else if (eventData.type == "weaponsEventData") {
      let table = eventData.data;
      $('#weaponreg-timeline-right-event-title').data("id", table.id);
      $('#weaponreg-timeline-right-event-title').empty();
      $('#weaponreg-timeline-right-event-title').val($.trim(table.title));

      $('#weaponreg-timeline-right-event-details').val(table.details);

      $(".weaponreg-timeline-persons-tags-holder").empty();
      $.each(table["personsinvolved"], function (index, value) {
  
        $(".weaponreg-timeline-persons-tags-holder").prepend(
          `<div class="tag">${value}</div>`
        );
      });
    
    
    } else if (eventData.type == "searchedVehicles") {

    } else if (eventData.type == "getVehicleData") {
      impoundChanged = false;
      let table = eventData.data;

      $(".vehicle-information-title-holder").data(
        "dbid",
        Number(table["dbid"])
      );

      $(".vehicle-info-plate-input").val(table["plate"]);
      $(".vehicle-info-owner-input").val(table["name"]);
      $(".vehicle-info-class-input").val(table["class"]);
      $(".vehicle-info-model-input").val(table["model"]);
      $('.vehicle-info-model-input').data("modelName", table['dataModelName']);
      $(".vehicle-info-imageurl-input").val(table["image"]);

      $(".vehicle-info-content").val(table["information"]);

      $(".vehicle-tags").empty();
      $(".vehicle-info-image").attr("src", table["image"]);
      $(".vehicle-tags").prepend(
        `<div class="dmv-tag ${table.color}-color">${table.colorName}</div>`
      );

      let impound = "red-tag";
      let bolo = "red-tag";
      let codefive = "red-tag";
      let stolen = "red-tag";

      if (table.impound) {
        impound = "green-tag";
      }

      if (table.bolo) {
        bolo = "green-tag";
      }

      if (table.code) {
        codefive = "green-tag";
      }

      if (table.stolen) {
        stolen = "green-tag";
      }

      $(".vehicle-tags").append(
        `<div class="vehicle-tag ${impound} impound-tag">Impound</div>`
      );
      $(".vehicle-tags").append(
        `<div class="vehicle-tag ${bolo}">BOLO</div>`
      );
      $(".vehicle-tags").append(
        `<div class="vehicle-tag ${codefive} code5-tag">Code 5</div>`
      );
      $(".vehicle-tags").append(
        `<div class="vehicle-tag ${stolen} stolen-tag">Stolen</div>`
      );
      $(".vehicle-info-imageurl-input").val(table["image"]);

      let numCheckboxset = 0
      jQuery("input[name='strikecheck']").each(function() {
        
        if (numCheckboxset<table['strikes']){
          this.checked=true;
        }
        else{
          this.checked=false;
        }
        numCheckboxset +=1;
      });


    } else if (eventData.type == "updateVehicleDbId") {
      $(".vehicle-information-title-holder").data("dbid", Number(eventData.data));
    } else if (eventData.type == "updateIncidentDbId") {
      $(".manage-incidents-editing-title").data("id", Number(eventData.data));

      $(".manage-incidents-tags-add-btn").css("pointer-events", "auto");
      $(".manage-incidents-reports-content").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-officers-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-civilians-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".manage-incidents-evidence-add-btn").css(
        "pointer-events",
        "auto"
      );
      $(".associated-incidents-tags-add-btn").css(
        "pointer-events",
        "auto"
      );
    } else if (eventData.type == "callDetach") {

      $(".active-calls-item")
        .filter("[data-id='" + eventData.callid + "']")
        .children()
        .children()
        .find(".call-radio")
        .html(eventData.data);

    

    } else if (eventData.type == "callAttach") {

      //update count
      $(".active-calls-item")
        .filter("[data-id='" + eventData.callid + "']")
        .children()
        .children()
        .find(".call-radio")
        .html(eventData.data);
        
    
    } else if (eventData.type == "statusImpound") {
      const table = eventData.data;
      const plate = eventData.plate;
      const linkedreport = table["linkedreport"];
      const fee = table["fee"];
      const time = table["time"] * 1000;

      let localDate = new Date(time);
      const impoundDate = localDate.toLocaleDateString("en-US", {
        timeZone: "UTC",
      });
      const impoundTime = localDate.toLocaleTimeString("en-US", {
        timeZone: "UTC",
      });

      $(".impound-plate").val(plate).attr("disabled", "disabled");
      $(".impound-linkedreport")
        .val(linkedreport)
        .attr("disabled", "disabled");
      $(".impound-fee")
        .val("$" + fee)
        .attr("disabled", "disabled");

      if (table.paid === 1) {
        $(".impound-fee").css("color", "green");
      } else {
        $(".impound-fee").css("color", "red");
      }

      $(".impound-time")
        .val(impoundDate + "  -  " + impoundTime)
        .attr("disabled", "disabled");
      $(".impound-cancel").html("Close");
      $(".impound-submit").fadeOut(250);
      $(".impound-form").slideDown(250);
      $(".impound-form").fadeIn(250);
    } else if (eventData.type == "greenImpound") {
      $(".vehicle-tags")
        .find(".impound-tag")
        .addClass("green-tag")
        .removeClass("red-tag");
    } else if (eventData.type == "redImpound") {
      $(".vehicle-tags")
        .find(".impound-tag")
        .removeClass("green-tag")
        .addClass("red-tag");
    }
  });
});

function fidgetSpinner(page) {
  $(".close-all").fadeOut(0);
  $(".container-load").fadeIn(0);
  
  if (page == ".dashboard-page-container"){
    $.post(`https://${GetParentResourceName()}/getAllDashboardData`, JSON.stringify({}));
  }
  if (page == ".bolos-page-container") {
    $.post(`https://${GetParentResourceName()}/getAllBolos`, JSON.stringify({}));
  }
  if (page == ".reports-page-container") {
    $.post(`https://${GetParentResourceName()}/getAllReports`, JSON.stringify({}));
  }
  if (page == ".weaponreg-page-container") {
    $.post(`https://${GetParentResourceName()}/getAllWeapons`, JSON.stringify({}));
  }
  if (page == ".doj-page-container") {
    $.post(`https://${GetParentResourceName()}/getAllWarrants`, JSON.stringify({}));
    $.post(`https://${GetParentResourceName()}/getActiveLawyers`, JSON.stringify({}));
    $.post(`https://${GetParentResourceName()}/getPrisoners`, JSON.stringify({}));
  }
  if (page == ".incidents-page-container") {
    $.post(`https://${GetParentResourceName()}/getAllIncidents`, JSON.stringify({}));
  }
  setTimeout(() => {
    $(".container-load").fadeOut(0);
    $(page).fadeIn(0);
  }, 50);
}

function timeShit() {
  let localDate = new Date();
  const myTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  date = localDate.toLocaleDateString("en-US", {
    timeZone: myTimeZone,
  });
  time = localDate.toLocaleTimeString("en-US", {
    timeZone: myTimeZone,
  });
  $(".date").html(date);
  $(".time").html(time);
}

setInterval(timeShit, 1000);

function addTag(tagInput) {
  $(".tags-holder").prepend(`<div class="tag">${tagInput}</div>`);

  $.post(
    `https://${GetParentResourceName()}/newTag`,
    JSON.stringify({
      id: $(".manage-profile-citizenid-input").val(),
      tag: tagInput,
    })
  );
}

// Context menu

var menu = document.querySelector(".contextmenu");

function showMenu(x, y) {
  $(".contextmenu").css("left", x + "px");
  $(".contextmenu").css("top", y + "px");
  $(".contextmenu").addClass("contextmenu-show");
}

function hideMenu() {
  $(".contextmenu").removeClass("contextmenu-show");
}

function onMouseDown(e) {
  hideMenu();
  document.removeEventListener("mouseup", onMouseDown);
}

function openContextMenu(e, args) {
  e.preventDefault();
  showMenu(e.pageX, e.pageY);
  $(".contextmenu").empty();
  $.each(args, function (index, value) {
    if (value.status !== "blur(5px)") {
      $(".contextmenu").prepend(
        `
                <li class="contextmenu-item ${value.className}" data-info="${value.info}" data-status="${value.status}">
                    <a href="#" class="contextmenu-btn">
                        <i class="${value.icon}"></i>
                        <span class="contextmenu-text">${value.text}</span>
                    </a>
                </li>
                `
      );
    }
  });
  document.addEventListener("mouseup", onMouseDown);
}

function expandImage(url) {
  $(".close-all").css("filter", "brightness(35%)");
  $(".gallery-image-enlarged").fadeIn(150);
  $(".gallery-image-enlarged").css("display", "block");
  $(".gallery-image-enlarged").attr("src", url);
}

function removeImage(url) {
  let cid = $(".manage-profile-citizenid-input").val();
  $(".gallery-inner-container img")
    .filter("[src='" + url + "']")
    .remove();
}

function hideIcidentsMenu() {
  if (
    $(".icidents-person-search-container").css("display") != "none" &&
    !mouse_is_inside
  ) {
    $(".icidents-person-search-container").fadeOut(250);
    $(".close-all").css("filter", "none");
  }
}
function hideWarrantsMenu() {
  if (
    $(".newwarrants-person-search-container").css("display") != "none" &&
    !mouse_is_inside
  ) {
    $(".newwarrants-person-search-container").fadeOut(250);
    $(".close-all").css("filter", "none");
  }
}

function onMouseDownIcidents(e) {
  hideIcidentsMenu();
  document.removeEventListener("mouseup", onMouseDownIcidents);
}
function onMouseDownWarrants(e) {
  hideWarrantsMenu();
  document.removeEventListener("mouseup", onMouseDownWarrants);
}

function titleCase(str) {
  return str
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function searchProfilesResults(result) {
  canSearchForProfiles = true;
  $(".profile-items").empty();

  if (result.length < 1) {
    $(".profile-items").html(
      `
                      <div class="profile-item" data-id="0">

                          <div style="display: flex; flex-direction: column; margin-top: 2.5px; margin-left: 5px; width: 100%; padding: 5px;">
                          <div style="display: flex; flex-direction: column;">
                              <div class="profile-item-title">No Users Matching that search</div>
                              </div>
                              <div class="profile-bottom-info">
                              </div>
                          </div>
                      </div>
              `
    );
    return true;
  }

  let profileHTML = "";

  result.forEach((value) => {
    let charinfo = value.charinfo;
    let metadata = value.licences;

    if (typeof value.charinfo == "string") {
      charinfo = JSON.parse(charinfo);
    }

    if (typeof value.metadata == "string") {
      metadata = JSON.parse(metadata);
    }

    let name = charinfo.firstname + " " + charinfo.lastname;
    let warrant = "none";
    //let convictions = "red-tag";

    let licences = "";
    let licArr = Object.entries(value.licences);

    if (licArr.length == 0 || licArr.length == undefined) {
      var licenseTypes = ['learners', 'pilot', 'fishing', 'hunting', 'weapon1',  'weapon2', 'weapon3', 'driver'];
      licArr = Object.entries(licenseTypes.reduce((licenseType, licenseValue) => (licenseType[licenseValue] = false, licenseType), {}));
    }

    if (licArr.length > 0 && (PoliceJobs[playerJob] !== undefined || DojJobs[playerJob] !== undefined)) {
      for (const [lic, hasLic] of licArr) {
        let tagColour =
          hasLic == true ? "green-tag" : "red-tag";
        licences += `<span class="license-tag ${tagColour}">${titleCase(lic)}</span>`;
      }
    }

    if (value.warrant == true) {
      warrant = "unset";
    }

    /*
      if (value.convictions < 5) {
      convictions = "green-tag";
    } else if (
      value.convictions > 4 &&
      value.convictions < 15
    ) {
      convictions = "orange-tag";
    } 
    */


    if (value.pp == '') {
      value.pp = 'img/not-found.jpg'
    }

    let recentlySeenState = "unset";
    if(!value.online){
      recentlySeenState="none";
    }

    profileHTML += `
                  <div class="profile-item" data-id="${value.citizenid}">
                      <img src="${value.pp}" class="profile-image">
                      <div style="display: flex; flex-direction: column; margin-top: 2.5px; margin-left: 5px; width: 100%; padding: 5px;">
                      <div style="display: flex; flex-direction: column;">
                          <div class="profile-item-title">${name} <span style="margin-left:1vh; display:${recentlySeenState}" class="recently-seen">
                              <span class="dot"></span> Recently Seen
                            </span>
                          </div>
                              <div class="profile-tags">
                                  ${licences}
                              </div>
                              <div style = "display:${warrant}; height:1.8vh; top: -2vh; width:fit-content; color:white;" class="profile-tags red-tag">
                                 Wanted
                              </div>
                          </div>
                          <div class="profile-bottom-info">
                              <div class="profile-id">CID: ${value.citizenid}</div>&nbsp;
                          </div>
                      </div>
                  </div>
              `;
  });

  $(".profile-items").html(profileHTML);
}
function searchWarrantResult(result) {
  canSearchForWarrants = true;
  $(".doj-warrants-list").empty();

  if (result.length < 1) {
    $.each(result, function (index, value) {
        
      let warrantDuration = Number(value.duration);

      //start date plus hours = end date
      var hoursLeft = new Date(Number(value.time)+Number(warrantDuration)*60*60*1000);
      hoursLeft = (hoursLeft - Date.now())/36e5;
      var expiredBool = hoursLeft<0;

      let recentlySeenState = "unset";
      if(!value.online){
        recentlySeenState="none";
      }

      var element = `<div class="doj-warrants-item" data-state=${value.state} data-expired=${expiredBool} data-id=${value.id} data-cid=${value.cid} data-inc=${value.linkedincident} data-rep=${value.linkedincident}>
      <div style="display: flex; flex-direction: row; margin-top: 2.5px; margin-left: 0.75vh; width: 100%;">
          <span style="display: flex; flex-direction:column">
             <div style="display: flex; flex-direction: column;">
                <div class="warrant-title">${value.name} <span style="margin-top: 0vh; margin-left:1vh; height:0vh; display:${recentlySeenState}" class="recently-seen">
                  <span class="dot"></span> Recently Seen
                  </span>
                </div>  
               
              </div>
              `;
              if(value.state===0){
                element+=`<div class="warrant-state" style="color:orange;">Pending</div>`
              }
              if(value.state===1){
                element+=`<div class="warrant-state" style="color:rgb(47, 193, 74);">Approved</div>`
              }
            element+= `
            <div class="warrant-bottom-info">`;
            if (value.linkedincident!=undefined){
              element+= `<div class="warrant-id">Incident ID: ${value.linkedincident}</div>`;
            }
            if (value.linkedreport!=undefined){
              element+= `<div class="warrant-id">Report ID: ${value.linkedreport}</div>`;
            }

            var timeElement;

            if(hoursLeft<24 && hoursLeft>0){
              timeElement= `</div><div class="warrant-time">Expires Today (${Math.round(hoursLeft)})</div>`;
            }
            if (hoursLeft>24){
              timeElement= `</div><div class="warrant-time">Time left: ${Math.round(hoursLeft)}</div>`;
            }
            if(hoursLeft<=0){
              timeElement= `</div><div style="color:red;" class="warrant-time">EXPIRED</div>`;
            }
            element+=timeElement;
            

            element+=`
            </span>
            </div>
            <img src="${value.pp}" class="warrant-image">
            
           
        
      </div>`;


    $('.doj-warrants-list').prepend(element);
    });

    return true;
  }
}


window.addEventListener("load", function () {
  document
    .getElementById("offenses-search")
    .addEventListener("keyup", function () {
      var search = this.value.toLowerCase();
      if (search.length > 1) {
        $.each($(".offense-item"), function (i, d) {
          const Name = $(this)
            .find(".offense-item-offense")
            .html()
            .toLowerCase();
          const Number = $(this)
            .find(".offense-item-id")
            .html()
            .toLowerCase();
          if (Name.includes(search)) {
            $(this).show();
          } else if (Number.includes(search)) {
            $(this).show();
          } else {
            $(this).hide();
          }
        });
      } else {
        $.each($(".offense-item"), function (i, d) {
          $(this).show();
        });
      }
    });
});
