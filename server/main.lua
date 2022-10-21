local QBCore = exports['qb-core']:GetCoreObject()
-- Maybe cache?
local incidents = {}
local convictions = {}
local bolos = {}

-- TODO make it departments compatible
local activeUnits = {}

local impound = {}
local dispatchMessages = {}

local function IsPolice(job)
	for k, v in pairs(Config.PoliceJobs) do
        if job == k then
            return true
        end
    end
    return false
end

local function IsEms(job)
	for k, v in pairs(Config.AmbulanceJobs) do
        if job == k then
            return true
        end
    end
    return false
end

local function IsDoj(job)
	for k, v in pairs(Config.DojJobs) do
        if job == k then
            return true
        end
    end
    return false
end


AddEventHandler("onResourceStart", function(resourceName)
	if (resourceName == 'ps-mdt') then
        activeUnits = {}
    end
end)

RegisterNetEvent("ps-mdt:server:OnPlayerUnload", function()
	--// Delete player from the MDT on logout
	local src = source
	local player = QBCore.Functions.GetPlayer(src)
	if activeUnits[player.PlayerData.citizenid] ~= nil then
		activeUnits[player.PlayerData.citizenid] = nil
	end
end)

AddEventHandler("playerDropped", function(reason)
	--// Delete player from the MDT on logout
	local src = source
	local player = QBCore.Functions.GetPlayer(src)
	if player ~= nil then
		if activeUnits[player.PlayerData.citizenid] ~= nil then
			activeUnits[player.PlayerData.citizenid] = nil
		end
	else
		local license = QBCore.Functions.GetIdentifier(src, "license")
		local citizenids = GetCitizenID(license)

		for _, v in pairs(citizenids) do
			if activeUnits[v.citizenid] ~= nil then
				activeUnits[v.citizenid] = nil
			end
		end
	end
end)

RegisterNetEvent("ps-mdt:server:ToggleDuty", function(state)
    local src = source
    local player = QBCore.Functions.GetPlayer(src)
	if not state then
		if activeUnits[player.PlayerData.citizenid] ~= nil then
			activeUnits[player.PlayerData.citizenid] = nil
		end
	else
		activeUnits[PlayerData.citizenid] = {
			cid = PlayerData.citizenid,
			callSign = PlayerData.metadata['callsign'],
			subdivision = subdiv,
			firstName = PlayerData.charinfo.firstname:sub(1,1):upper()..PlayerData.charinfo.firstname:sub(2),
			lastName = PlayerData.charinfo.lastname:sub(1,1):upper()..PlayerData.charinfo.lastname:sub(2),
			radio = Radio,
			unitType = PlayerData.job.name,
			duty = PlayerData.job.onduty
		}
	end
end)

QBCore.Functions.CreateCallback('mdt:server:getCallSource', function(_, cb, callid)
	local calls = exports["ps-dispatch"]:GetDispatchCalls()
    local callsource = false
	callid = tonumber(callid)
    if calls[callid] then
        callsource = calls[callid].source
    end
	cb(callsource)
end)

RegisterNetEvent('mdt:server:openMDT', function(subdiv)
	local src = source
	local PlayerData = GetPlayerData(src)
	if not PermCheck(src, PlayerData) then return end
	local Radio = Player(src).state.radioChannel or 0
	--[[ if Radio > 100 then
		Radio = 0
	end ]]

	activeUnits[PlayerData.citizenid] = {
		cid = PlayerData.citizenid,
		callSign = PlayerData.metadata['callsign'],
		subdivision = subdiv,
		firstName = PlayerData.charinfo.firstname:sub(1,1):upper()..PlayerData.charinfo.firstname:sub(2),
		lastName = PlayerData.charinfo.lastname:sub(1,1):upper()..PlayerData.charinfo.lastname:sub(2),
		radio = Radio,
		unitType = PlayerData.job.name,
		duty = PlayerData.job.onduty
	}

	local JobType = GetJobType(PlayerData.job.name)

	local calls = exports['ps-dispatch']:GetDispatchCalls()

	--TriggerClientEvent('mdt:client:dashboardbulletin', src, bulletin)
	TriggerClientEvent('mdt:client:open', src, bulletin, activeUnits, calls, PlayerData.citizenid)
	TriggerClientEvent('mdt:client:GetActiveUnits', src, activeUnits)
end)


--find player cid
QBCore.Functions.CreateCallback('mdt:server:SearchProfile', function(source, cb, sentData)
	if not sentData then  return cb({}) end
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		local people = MySQL.query.await("SELECT p.citizenid, p.charinfo, md.pfp FROM players p LEFT JOIN mdt_data md on p.citizenid = md.cid WHERE LOWER(metadata) LIKE :query or LOWER(citizenid) LIKE :query or LOWER(CONCAT(JSON_VALUE(p.charinfo, '$.firstname'), ' ', JSON_VALUE(p.charinfo, '$.lastname'))) LIKE :query LIMIT 20;",{
			query = string.lower('%'..sentData..'%'),
		})
		--local people = MySQL.query.await("SELECT p.citizenid, p.charinfo, md.pfp FROM players p LEFT JOIN mdt_data md on p.citizenid = md.cid WHERE LOWER(CONCAT(JSON_VALUE(p.charinfo, '$.firstname'), ' ', JSON_VALUE(p.charinfo, '$.lastname'))) LIKE :query OR LOWER(`charinfo`) LIKE :query OR LOWER(`citizenid`) LIKE :query OR LOWER(`fingerprint`) LIKE :query LIMIT 20;", { query = string.lower('%'..sentData..'%'), jobtype = JobType })
		local citizenIds = {}
		local citizenIdIndexMap = {}
		if not next(people) then cb({}) return end

		for index, data in pairs(people) do
			local players = QBCore.Functions.GetQBPlayers()
			for _, v in pairs(players) do
				if v then
					if v.PlayerData then
						local citizenid = v.PlayerData.citizenid
						if(citizenid == data.citizenid) then
							people[index].online=true
							break
						else
							people[index].online=false
						end
					end
				end
				
			end
			people[index]['warrant'] = false
			people[index]['licences'] = GetPlayerLicenses(data.citizenid)
			people[index]['pp'] = ProfPic(data.gender, data.pfp)
			citizenIds[#citizenIds+1] = data.citizenid
			citizenIdIndexMap[data.citizenid] = index
		end

		return cb(people)	
	end

	return cb({})
end)

QBCore.Functions.CreateCallback("mdt:server:getWarrants", function(source, cb)
	local WarrantData = {}
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		local matches = MySQL.query.await("SELECT * FROM mdt_warrants ORDER BY time ASC;", {})
		for _, value in pairs(matches) do
			local data = MySQL.query.await("SELECT pfp FROM mdt_data WHERE cid = :warrantCID LIMIT 1;",{
				warrantCID = value.cid
			})
			
			local online = false
			local players = QBCore.Functions.GetQBPlayers()
			for _, v in pairs(players) do
				if v then
					if v.PlayerData then
						local citizenid = v.PlayerData.citizenid
						if(citizenid == value.cid) then
							online=true
							break
						else
							online=false
						end
					end
				end
				
			end

			local time = value.time
			if value.state==0 then
				time=os.time()*1000

			end
			WarrantData[#WarrantData+1] = {
				id = value.id,
                cid = value.cid,
				pp = ProfPic("f", data[1].pfp),
                linkedincident = value.linkedincident,
				linkedreport = value.linkedreport,
				state = value.state,
                name = GetNameFromId(value.cid),
                time = time,
				duration = value.duration,
				details = value.details,
				online = online,
            }
		end
		TriggerClientEvent('mdt:client:getAllWarrants', src, WarrantData)
	end

   
    cb(WarrantData)
end)

RegisterNetEvent('ps-mdt:server:expungePerson', function(cid)
	local data = MySQL.query.await("UPDATE mdt_data SET `latestexpungement`=:sentTime WHERE cid = :sentCID;",{
		sentTime = os.time()*1000,
		sentCID = cid
	})
end)


RegisterNetEvent("mdt:server:getWarrantData", function(id)
	local WarrantData = {}
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		local warrant = MySQL.query.await("SELECT * FROM mdt_warrants WHERE id = :sentid;", {
			sentid = tonumber(id),
		})
		if not warrant then return end
		local data = MySQL.query.await("SELECT pfp FROM mdt_data WHERE cid = :warrantCID LIMIT 1;",{
			warrantCID = warrant[1].cid
		})
		local profPic = "img/male.png"
		if data then
			if data[1] then
				profPic = ProfPic("f", data[1].pfp)
			end
		end

		local time = warrant[1].time
		if warrant[1].state==0 then
			time=os.time()*1000

		end

		WarrantData[#WarrantData+1] = {
			id = warrant[1].id,
			cid = warrant[1].cid,
			pp = profPic,
			linkedincident = warrant[1].linkedincident,
			linkedreport = warrant[1].linkedreport,
			state = warrant[1].state,
			name = GetNameFromId(warrant[1].cid),
			time = time,
			duration = warrant[1].duration,
			details = warrant[1].details,
		}

		TriggerClientEvent('mdt:client:returnWarrantData',src, WarrantData)
	end

   
end)


QBCore.Functions.CreateCallback('mdt:server:GetProfileData', function(source, cb, sentId)
	if not sentId then return cb({}) end

	local src = source
	local PlayerData = GetPlayerData(src)
	local IsPolice =  PermCheck(src, PlayerData)

	local JobType = GetJobType(PlayerData.job.name)

	local target = GetPlayerDataById(sentId)
	local JobName = PlayerData.job.name


	if not target or not next(target) then return cb({}) end

	-- Convert to string because bad code, yes?
	if type(target.job) == 'string' then target.job = json.decode(target.job) end
	if type(target.charinfo) == 'string' then target.charinfo = json.decode(target.charinfo) end
	if type(target.metadata) == 'string' then target.metadata = json.decode(target.metadata) end

	local licencesdata = target.metadata['licences'] or {
        ['driver'] = false,
        ['business'] = false,
        ['weapon1'] = false,
		['weapon2'] = false,
		['weapon3'] = false,
		['pilot'] = false
	}

	local job, grade = UnpackJob(target.job)

	local person = {
		cid = target.citizenid,
		firstname = target.charinfo.firstname,
		lastname = target.charinfo.lastname,
		job = job.label,
		grade = grade.name,
		pp = ProfPic(target.charinfo.gender),
		licences = licencesdata,
		dob = target.charinfo.birthdate,
		mdtinfo = '',
		fingerprint = target.metadata["fingerprint"],
		phonenumber = target.charinfo["phone"],
		probationstatus = target.metadata["onprobation"],
		tags = {},
		vehicles = {},
		properties = {},
		gallery = {},
		isLimited = false
	}

	--Everyone can see charges
	if true then--Config.PoliceJobs[JobName] then

		local convictions
		if Config.PoliceJobs[JobName] or Config.DojJobs[JobName] then
			convictions = GetConvictions({person.cid})
		else
			convictions = GetConvictionsWithExpungement({person.cid})
		end
		
		
		person.convictions2 = {}
		local convCount = 1
		if next(convictions) then
			for _, conv in pairs(convictions) do
				if conv.warrant then person.warrant = true end
				local charges = json.decode(conv.charges)
				for _, charge in pairs(charges) do
					person.convictions2[convCount] = charge
					convCount = convCount + 1
				end
			end
		end
		local hash = {}
		person.convictions = {}

		for _,v in ipairs(person.convictions2) do
			if (not hash[v]) then
				person.convictions[#person.convictions+1] = v -- found this dedupe method on sourceforge somewhere, copy+pasta dev, needs to be refined later
				hash[v] = true
			end
		end
		local vehicles = GetPlayerVehicles(person.cid)

		if vehicles then
			person.vehicles = vehicles
		end
		local Coords = {}
		local Houses = {}
		local properties= GetPlayerProperties(person.cid)
		for k, v in pairs(properties) do
			Coords[#Coords+1] = {
                coords = json.decode(v["coords"]),
            }
		end
		for index = 1, #Coords, 1 do
			Houses[#Houses+1] = {
                label = properties[index]["label"],
                coords = tostring(Coords[index]["coords"]["enter"]["x"]..",".. Coords[index]["coords"]["enter"]["y"].. ",".. Coords[index]["coords"]["enter"]["z"]),
            }
        end
		-- if properties then
			person.properties = Houses
		-- end
	end

	local mdtData = GetPersonInformation(sentId)
	if mdtData then
		person.mdtinfo = mdtData.information
		person.profilepic = mdtData.pfp
		person.tags = json.decode(mdtData.tags)
		person.gallery = json.decode(mdtData.gallery)
	end

	return cb(person)
end)

RegisterNetEvent("mdt:server:saveProfile", function(pfp, information, cid, fName, sName, tags, gallery, licenses)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	ManageLicenses(cid, licenses)
	if Player then
		local JobType = Player.PlayerData.job.name
		if IsPolice(JobType) or JobType=="judge" then
			MySQL.Async.insert('INSERT INTO mdt_data (cid, information, pfp, tags, gallery) VALUES (:cid, :information, :pfp, :tags, :gallery) ON DUPLICATE KEY UPDATE cid = :cid, information = :information, pfp = :pfp, tags = :tags, gallery = :gallery', {
				cid = cid,
				information = information,
				pfp = pfp,
				tags = json.encode(tags),
				gallery = json.encode(gallery),
			})
		else
			TriggerClientEvent("QBCore:Notify", src, 'No permission to edit', 'error')
		end
	end
end)

RegisterNetEvent("mdt:server:updateLicense", function(cid, type, status)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		if (IsPolice(Player.PlayerData.job.name)) then
			ManageLicense(cid, type, status)
		end
	end
end)

-- Incidents


RegisterNetEvent('mdt:server:getAllIncidents', function()
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		local JobType = GetJobType(Player.PlayerData.job.name)
		if IsPolice(JobType) or IsDoj(JobType) then
			print("good permission")
			local matches = MySQL.query.await("SELECT * FROM mdt_incidents ORDER BY id DESC LIMIT 30", {})
			TriggerClientEvent('mdt:client:getAllIncidents', src, matches)	
		end
	end
end)

RegisterNetEvent('mdt:server:searchIncidents', function(query)
	if query then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local JobType = GetJobType(Player.PlayerData.job.name)
			if IsPolice(JobType) or IsDoj(JobType) then
				local matches = MySQL.query.await("SELECT * FROM mdt_incidents WHERE id LIKE :query OR LOWER(title) LIKE :query OR LOWER(author) LIKE :query OR LOWER(details) LIKE :query OR LOWER(tags) LIKE :query OR LOWER(officersinvolved) LIKE :query OR LOWER(civsinvolved) LIKE :query OR LOWER(author) LIKE :query ORDER BY id DESC LIMIT 50", {
					query = string.lower('%'..query..'%') -- % wildcard, needed to search for all alike results
				})

				TriggerClientEvent('mdt:client:getIncidents', src, matches)
			end
		end
	end
end)

RegisterNetEvent('mdt:server:searchWarrants', function(query)
	if query then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local JobType = GetJobType(Player.PlayerData.job.name)
			if IsPolice(JobType) or IsDoj(JobType) then
				local WarrantData = {}
				local matches = MySQL.query.await("SELECT * FROM mdt_warrants WHERE id LIKE :query OR linkedincident LIKE :query OR linkedreport LIKE :query OR cid LIKE :query ORDER BY id DESC LIMIT 25;", {
					query = string.lower('%'..query..'%') -- % wildcard, needed to search for all alike results
				})
				for _, value in pairs(matches) do
					local data = MySQL.query.await("SELECT pfp FROM mdt_data WHERE cid = :warrantCID LIMIT 1;",{
						warrantCID = value.cid
					})
					local profPic = "img/male.png"
					if data then
						if data[1] then
							profPic = ProfPic("f", data[1].pfp)
						end
					end

					local online = false
					local players = QBCore.Functions.GetQBPlayers()
					for _, v in pairs(players) do
						if v then
							if v.PlayerData then
								local citizenid = v.PlayerData.citizenid
								if(citizenid == value.cid) then
									online=true
									break
								else
									online=false
								end
							end
						end
						
					end
					local time = value.time
					if value.state==0 then
						time=os.time()*1000

					end
					WarrantData[#WarrantData+1] = {
						id = value.id,
						cid = value.cid,
						pp = profPic,
						linkedincident = value.linkedincident,
						linkedreport = value.linkedreport,
						state = value.state,
						name = GetNameFromId(value.cid),
						time = time,
						duration = value.duration,
						details = value.details,
						online = online,
					}
				
				end
				TriggerClientEvent('mdt:client:getWarrants', src, WarrantData)
			end
		end
	end
end)

RegisterNetEvent('mdt:server:getIncidentData', function(sentId)
	if sentId then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local JobType = GetJobType(Player.PlayerData.job.name)
			if IsPolice(JobType) or IsDoj(JobType) then
				local matches = MySQL.query.await("SELECT * FROM mdt_incidents WHERE id = :id", {
					id = sentId
				})
				local data = matches[1]
				data['tags'] = json.decode(data['tags'])
				data['officersinvolved'] = json.decode(data['officersinvolved'])
				data['civsinvolved'] = json.decode(data['civsinvolved'])
				data['evidence'] = json.decode(data['evidence'])


				local convictions = MySQL.query.await("SELECT * FROM mdt_convictions WHERE linkedincident = :id", {
					id = sentId
				})
				if convictions ~= nil then
					for i=1, #convictions do
						local res = GetNameFromId(convictions[i]['cid'])
						if res ~= nil then
							convictions[i]['name'] = res
						else
							convictions[i]['name'] = "Unknown"
						end
						convictions[i]['charges'] = json.decode(convictions[i]['charges'])
					end
				end
				TriggerClientEvent('mdt:client:getIncidentData', src, data, convictions)
			end
		end
	end
end)

RegisterNetEvent('mdt:server:getAllBolos', function()
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance'  then
		local matches = MySQL.query.await("SELECT * FROM `mdt_bolos` WHERE jobtype = :jobtype", {jobtype = JobType})
		TriggerClientEvent('mdt:client:getAllBolos', src, matches)
	end
end)

RegisterNetEvent('mdt:server:searchBolos', function(sentSearch)
	if sentSearch then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		local JobType = GetJobType(Player.PlayerData.job.name)
		if JobType == 'police' or JobType == 'ambulance'  then
			local matches = MySQL.query.await("SELECT * FROM `mdt_bolos` WHERE `id` LIKE :query OR LOWER(`title`) LIKE :query OR `plate` LIKE :query OR LOWER(`owner`) LIKE :query OR LOWER(`individual`) LIKE :query OR LOWER(`detail`) LIKE :query OR LOWER(`officersinvolved`) LIKE :query OR LOWER(`tags`) LIKE :query OR LOWER(`author`) LIKE :query AND jobtype = :jobtype", {
				query = string.lower('%'..sentSearch..'%'), -- % wildcard, needed to search for all alike results
				jobtype = JobType
			})
			TriggerClientEvent('mdt:client:getBolos', src, matches)
		end
	end
end)

RegisterNetEvent('mdt:server:getBoloData', function(sentId)
	if sentId then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		local JobType = GetJobType(Player.PlayerData.job.name)
		if JobType == 'police' or JobType == 'ambulance'  then
			local matches = MySQL.query.await("SELECT * FROM `mdt_bolos` WHERE `id` = :id AND jobtype = :jobtype LIMIT 1", {
				id = sentId,
				jobtype = JobType
			})

			local data = matches[1]
			data['tags'] = json.decode(data['tags'])
			data['officersinvolved'] = json.decode(data['officersinvolved'])
			data['gallery'] = json.decode(data['gallery'])
			TriggerClientEvent('mdt:client:getBoloData', src, data)
		end
	end
end)

RegisterNetEvent('mdt:server:newBolo', function(existing, id, title, plate, owner, individual, detail, tags, gallery, officersinvolved, time)
	if id then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		local JobType = GetJobType(Player.PlayerData.job.name)
		if JobType == 'police' or JobType == 'ambulance'  then
			local fullname = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname

			local function InsertBolo()
				MySQL.insert('INSERT INTO `mdt_bolos` (`title`, `author`, `plate`, `owner`, `individual`, `detail`, `tags`, `gallery`, `officersinvolved`, `time`, `jobtype`) VALUES (:title, :author, :plate, :owner, :individual, :detail, :tags, :gallery, :officersinvolved, :time, :jobtype)', {
					title = title,
					author = fullname,
					plate = plate,
					owner = owner,
					individual = individual,
					detail = detail,
					tags = json.encode(tags),
					gallery = json.encode(gallery),
					officersinvolved = json.encode(officersinvolved),
					time = tostring(time),
					jobtype = JobType
				}, function(r)
					if r then
						TriggerClientEvent('mdt:client:boloComplete', src, r)
						TriggerEvent('mdt:server:AddLog', "A new BOLO was created by "..fullname.." with the title ("..title..") and ID ("..id..")")
					end
				end)
			end

			local function UpdateBolo()
				MySQL.update("UPDATE mdt_bolos SET `title`=:title, plate=:plate, owner=:owner, individual=:individual, detail=:detail, tags=:tags, gallery=:gallery, officersinvolved=:officersinvolved WHERE `id`=:id AND jobtype = :jobtype LIMIT 1", {
					title = title,
					plate = plate,
					owner = owner,
					individual = individual,
					detail = detail,
					tags = json.encode(tags),
					gallery = json.encode(gallery),
					officersinvolved = json.encode(officersinvolved),
					id = id,
					jobtype = JobType
				}, function(r)
					if r then
						TriggerClientEvent('mdt:client:boloComplete', src, id)
						TriggerEvent('mdt:server:AddLog', "A BOLO was updated by "..fullname.." with the title ("..title..") and ID ("..id..")")
					end
				end)
			end

			if existing then
				UpdateBolo()
			elseif not existing then
				InsertBolo()
			end
		end
	end
end)

RegisterNetEvent('mdt:server:deleteBolo', function(id)
	if id then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		local JobType = GetJobType(Player.PlayerData.job.name)
		if JobType == 'police'  then
			local fullname = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
			MySQL.update("DELETE FROM `mdt_bolos` WHERE id=:id", { id = id, jobtype = JobType })
			TriggerEvent('mdt:server:AddLog', "A BOLO was deleted by "..fullname.." with the ID ("..id..")")
		end
	end
end)

RegisterNetEvent('mdt:server:deleteICU', function(id)
	if id then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		local JobType = GetJobType(Player.PlayerData.job.name)
		if JobType == 'ambulance' then
			local fullname = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
			MySQL.update("DELETE FROM `mdt_bolos` WHERE id=:id", { id = id, jobtype = JobType })
			TriggerEvent('mdt:server:AddLog', "A ICU Check-in was deleted by "..fullname.." with the ID ("..id..")")
		end
	end
end)

RegisterNetEvent('mdt:server:incidentSearchPerson', function(query)
    if query then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local JobType = GetJobType(Player.PlayerData.job.name)
			if JobType == 'police' or JobType == 'doj'  then
				local function ProfPic(gender, profilepic)
					if profilepic then return profilepic end;
					if gender == "f" then return "img/female.png" end;
					return "img/male.png"
				end

				local result = MySQL.query.await("SELECT p.citizenid, p.charinfo, md.pfp from players p LEFT JOIN mdt_data md on p.citizenid = md.cid WHERE LOWER(`charinfo`) LIKE :query OR LOWER(`citizenid`) LIKE :query LIMIT 30", {
					query = string.lower('%'..query..'%'), -- % wildcard, needed to search for all alike results
				})
				local data = {}
				for i=1, #result do
					local charinfo = json.decode(result[i].charinfo)
					data[i] = {id = result[i].citizenid, firstname = charinfo.firstname, lastname = charinfo.lastname, profilepic = ProfPic(charinfo.gender, result[i].pfp)}
				end
				TriggerClientEvent('mdt:client:incidentSearchPerson', src, data)
            end
        end
    end
end)

RegisterNetEvent('mdt:server:newwarrantSearchPerson', function(query)
    if query then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local JobType = GetJobType(Player.PlayerData.job.name)
			if JobType == 'police' or JobType == 'doj'  then
				local function ProfPic(gender, profilepic)
					if profilepic then return profilepic end;
					if gender == "f" then return "img/female.png" end;
					return "img/male.png"
				end

				local result = MySQL.query.await("SELECT p.citizenid, p.charinfo, md.pfp from players p LEFT JOIN mdt_data md on p.citizenid = md.cid WHERE LOWER(`charinfo`) LIKE :query OR LOWER(`citizenid`) LIKE :query LIMIT 30", {
					query = string.lower('%'..query..'%'), -- % wildcard, needed to search for all alike results
				})
				local data = {}
				for i=1, #result do
					local charinfo = json.decode(result[i].charinfo)
					data[i] = {id = result[i].citizenid, firstname = charinfo.firstname, lastname = charinfo.lastname, profilepic = ProfPic(charinfo.gender, result[i].pfp)}
				end
				TriggerClientEvent('mdt:client:newwarrantSearchPerson', src, data)
            end
        end
    end
end)

RegisterNetEvent('mdt:server:getAllReports', function()
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		if IsPolice(Player.PlayerData.job.name) or IsDoj(Player.PlayerData.job.name) then
			local matches = MySQL.query.await("SELECT * FROM `mdt_reports` WHERE jobtype='police' ORDER BY `id` DESC LIMIT 30", {
			})
			TriggerClientEvent('mdt:client:getAllReports', src, matches)
		elseif IsEms(Player.PlayerData.job.name) then
			local matches = MySQL.query.await("SELECT * FROM `mdt_reports` WHERE jobtype='ems' ORDER BY `id` DESC LIMIT 30", {
			})
			TriggerClientEvent('mdt:client:getAllReports', src, matches)
		end
	end
end)

RegisterNetEvent('mdt:server:getReportData', function(sentId)
	if sentId then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			if IsPolice(Player.PlayerData.job.name) or IsDoj(Player.PlayerData.job.name) then
				local matches = MySQL.query.await("SELECT * FROM mdt_reports WHERE id = :id  AND jobtype='police' LIMIT 1;", {
					id = tonumber(sentId),
				})
				local data = matches[1]
				data['id'] = tonumber(sentId)
				data['title'] = data['title']
				data['title'] = data['type']
				data['details'] = data['details']
				data['tags'] = json.decode(data['tags'])
				data['gallery'] = json.decode(data['gallery'])
				data['officersinvolved'] = json.decode(data['officersinvolved'])
				data['civsinvolved'] = json.decode(data['civsinvolved'])
				data['time'] = json.decode(data['time'])
				TriggerClientEvent('mdt:client:getReportData', src, data)
			elseif IsEms(Player.PlayerData.job.name) then
				local matches = MySQL.query.await("SELECT * FROM mdt_reports WHERE id = :id  AND jobtype='ems' LIMIT 1;", {
					id = tonumber(sentId),
				})
				local data = matches[1]
				data['id'] = tonumber(sentId)
				data['title'] = data['title']
				data['title'] = data['type']
				data['details'] = data['details']
				data['tags'] = json.decode(data['tags'])
				data['gallery'] = json.decode(data['gallery'])
				data['officersinvolved'] = json.decode(data['officersinvolved'])
				data['civsinvolved'] = json.decode(data['civsinvolved'])
				data['time'] = json.decode(data['time'])
				TriggerClientEvent('mdt:client:getReportData', src, data)
			end
		end
	end
end)

RegisterNetEvent('mdt:server:searchReports', function(sentSearch)
	if sentSearch then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			if IsPolice(Player.PlayerData.job.name) or IsDoj(Player.PlayerData.job.name) then
				local matches = MySQL.query.await("SELECT * FROM mdt_reports WHERE jobtype='police' AND (`id` LIKE :query OR LOWER(`author`) LIKE :query OR LOWER(`title`) LIKE :query OR LOWER(`type`) LIKE :query OR LOWER(`details`) LIKE :query OR LOWER(`tags`) LIKE :query) ORDER BY `id` DESC LIMIT 50;", {
					query = string.lower('%'..sentSearch..'%'), -- % wildcard, needed to search for all alike results
				})

				TriggerClientEvent('mdt:client:getAllReports', src, matches)
			elseif IsEms(Player.PlayerData.job.name) then
				local matches = MySQL.query.await("SELECT * FROM mdt_reports WHERE jobtype='ems' AND (`id` LIKE :query OR LOWER(`author`) LIKE :query OR LOWER(`title`) LIKE :query OR LOWER(`type`) LIKE :query OR LOWER(`details`) LIKE :query OR LOWER(`tags`) LIKE :query) ORDER BY `id` DESC LIMIT 50;", {
					query = string.lower('%'..sentSearch..'%'), -- % wildcard, needed to search for all alike results
				})

				TriggerClientEvent('mdt:client:getAllReports', src, matches)
			end
		end
	end
end)

RegisterNetEvent('mdt:server:newReport', function(existing, id, title, reporttype, details, tags, gallery, officers, civilians, time)
	if id then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			if IsPolice(Player.PlayerData.job.name) then
				local fullname = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
				local function InsertReport()
					MySQL.insert('INSERT INTO mdt_reports (`title`, `author`, `type`, `details`, `tags`, `gallery`, `officersinvolved`, `civsinvolved`, `time`, jobtype) VALUES (:title, :author, :type, :details, :tags, :gallery, :officersinvolved, :civsinvolved, :time, "police");', {
						title = title,
						author = fullname,
						type = reporttype,
						details = details,
						tags = json.encode(tags),
						gallery = json.encode(gallery),
						officersinvolved = json.encode(officers),
						civsinvolved = json.encode(civilians),
						time = tostring(time),
					}, function(r)
						if r then
							TriggerClientEvent('mdt:client:reportComplete', src, r)
							TriggerEvent('mdt:server:AddLog', "A new report was created by "..fullname.." with the title ("..title..") and ID ("..id..")")
						end
					end)
				end

				local function UpdateReport()
					MySQL.update("UPDATE `mdt_reports` SET `title` = :title, type = :type, details = :details, tags = :tags, gallery = :gallery, officersinvolved = :officersinvolved, civsinvolved = :civsinvolved WHERE `id` = :id LIMIT 1", {
						title = title,
						type = reporttype,
						details = details,
						tags = json.encode(tags),
						gallery = json.encode(gallery),
						officersinvolved = json.encode(officers),
						civsinvolved = json.encode(civilians),
						id = id,
					}, function(affectedRows)
						if affectedRows > 0 then
							TriggerClientEvent('mdt:client:reportComplete', src, id)
							TriggerEvent('mdt:server:AddLog', "A report was updated by "..fullname.." with the title ("..title..") and ID ("..id..")")
						end
					end)
				end

				if existing then
					UpdateReport()
				elseif not existing then
					InsertReport()
				end
			elseif IsEms(Player.PlayerData.job.name) then
				local fullname = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
				local function InsertReport()
					MySQL.insert('INSERT INTO mdt_reports (`title`, `author`, `type`, `details`, `tags`, `gallery`, `officersinvolved`, `civsinvolved`, `time`, jobtype) VALUES (:title, :author, :type, :details, :tags, :gallery, :officersinvolved, :civsinvolved, :time, "ems");', {
						title = title,
						author = fullname,
						type = reporttype,
						details = details,
						tags = json.encode(tags),
						gallery = json.encode(gallery),
						officersinvolved = json.encode(officers),
						civsinvolved = json.encode(civilians),
						time = tostring(time),
					}, function(r)
						if r then
							TriggerClientEvent('mdt:client:reportComplete', src, r)
							TriggerEvent('mdt:server:AddLog', "A new report was created by "..fullname.." with the title ("..title..") and ID ("..id..")")
						end
					end)
				end

				local function UpdateReport()
					MySQL.update("UPDATE `mdt_reports` SET `title` = :title, type = :type, details = :details, tags = :tags, gallery = :gallery, officersinvolved = :officersinvolved, civsinvolved = :civsinvolved WHERE `id` = :id LIMIT 1", {
						title = title,
						type = reporttype,
						details = details,
						tags = json.encode(tags),
						gallery = json.encode(gallery),
						officersinvolved = json.encode(officers),
						civsinvolved = json.encode(civilians),
						id = id,
					}, function(affectedRows)
						if affectedRows > 0 then
							TriggerClientEvent('mdt:client:reportComplete', src, id)
							TriggerEvent('mdt:server:AddLog', "A report was updated by "..fullname.." with the title ("..title..") and ID ("..id..")")
						end
					end)
				end

				if existing then
					UpdateReport()
				elseif not existing then
					InsertReport()
				end
			else
				TriggerClientEvent("QBCore:Notify", src, 'No edit permission', 'error')
			end
		end
	end
end)


RegisterNetEvent('mdt:server:getAllWarrants', function(dashboard)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)

	local WarrantData = {}

	if Player then
		local matches = MySQL.query.await("SELECT * FROM mdt_warrants ORDER BY time ASC;", {})
		for _, value in pairs(matches) do
			local data = MySQL.query.await("SELECT pfp FROM mdt_data WHERE cid = :warrantCID LIMIT 1;",{
				warrantCID = value.cid
			})
			local profPic = "img/male.png"
			if data then
				if data[1] then
					profPic = ProfPic("f", data[1].pfp)
				end
			end

			local online = false
			local players = QBCore.Functions.GetQBPlayers()
			for _, v in pairs(players) do
				if v then
					if v.PlayerData then
						local citizenid = v.PlayerData.citizenid
						if(citizenid == value.cid) then
							online=true
							break
						else
							online=false
						end
					end
				end
				
			end

			local time = value.time
			if value.state==0 then
				time=os.time()*1000

			end

			WarrantData[#WarrantData+1] = {
				id = value.id,
                cid = value.cid,
				pp = profPic,
                linkedincident = value.linkedincident,
				linkedreport = value.linkedreport,
				state = value.state,
                name = GetNameFromId(value.cid),
                time = time,
				duration = value.duration,
				details = value.details,
				online = online,
            }
		end
		if dashboard then
			TriggerClientEvent('mdt:client:getAllWarrantsDashboard', src, WarrantData)
		else
			TriggerClientEvent('mdt:client:getAllWarrants', src, WarrantData)
		end	
		
	end
end)

RegisterNetEvent('mdt:server:getActiveLawyers', function()
	local src = tonumber(source)
	local Player = QBCore.Functions.GetPlayer(src)

	local judges = {}
	local lawyers = {}

	if Player then
		local players = QBCore.Functions.GetQBPlayers()
		for _, v in pairs(players) do
			local PlayerData = v.PlayerData
			if PlayerData then
				if PlayerData.job.name == "judge" then 
					local skip = false
					for i, k in pairs(judges) do
						if k.cid == PlayerData.citizenid then
							skip = true
						end
					end
					if not skip then
						judges[#judges+1]={
							cid = PlayerData.citizenid,
							callSign = PlayerData.metadata['callsign'],
							firstName = PlayerData.charinfo.firstname:sub(1,1):upper()..PlayerData.charinfo.firstname:sub(2),
							lastName = PlayerData.charinfo.lastname:sub(1,1):upper()..PlayerData.charinfo.lastname:sub(2),
							unitType = PlayerData.job.name,
							duty = PlayerData.job.onduty,
							phonenumber = PlayerData.charinfo['phone'],
	
						}
					end
					
				end
				if PlayerData.job.name == "lawyer" then 
					print(PlayerData.metadata['phone'])
					local skip = false
					for i, k in pairs(lawyers) do
						if k.cid == PlayerData.citizenid then
							skip = true
						end
					end
					if not skip then
						lawyers[#lawyers+1]={
							cid = PlayerData.citizenid,
							callSign = PlayerData.metadata['callsign'],
							firstName = PlayerData.charinfo.firstname:sub(1,1):upper()..PlayerData.charinfo.firstname:sub(2),
							lastName = PlayerData.charinfo.lastname:sub(1,1):upper()..PlayerData.charinfo.lastname:sub(2),
							unitType = PlayerData.job.name,
							duty = PlayerData.job.onduty,
							phonenumber = PlayerData.charinfo['phone'],
						}
					end
					
				end
			end
			
		end
		TriggerClientEvent('mdt:client:returnAllLawyers', src, lawyers, judges)
		
	end
end)

RegisterNetEvent('mdt:server:getPrisoners', function()
	local src = tonumber(source)
	local Player = QBCore.Functions.GetPlayer(src)

	local prisoners = {}

	local probations = {}

	if Player then
		local players = QBCore.Functions.GetQBPlayers()
		for _, v in pairs(players) do
			local PlayerData = v.PlayerData
			if PlayerData then
				if PlayerData.metadata.injail>0 then 
					local skip = false
					for i, k in pairs(prisoners) do
						if k.cid == PlayerData.citizenid then
							skip = true
						end
					end
					prisoners[#prisoners+1]={
						cid = PlayerData.citizenid,
						firstName = PlayerData.charinfo.firstname:sub(1,1):upper()..PlayerData.charinfo.firstname:sub(2),
						lastName = PlayerData.charinfo.lastname:sub(1,1):upper()..PlayerData.charinfo.lastname:sub(2),
						time = PlayerData.metadata.injail,

					}
				end
				local skip = false
				if PlayerData.metadata.onprobation then 
					for i, k in pairs(probations) do
						if k.cid == PlayerData.citizenid then
							skip = true
						end
					end
					if not skip then
						probations[#probations+1]={
							cid = PlayerData.citizenid,
							firstName = PlayerData.charinfo.firstname:sub(1,1):upper()..PlayerData.charinfo.firstname:sub(2),
							lastName = PlayerData.charinfo.lastname:sub(1,1):upper()..PlayerData.charinfo.lastname:sub(2),
						}
					end
				end
			
			end
			
		end
		TriggerClientEvent('mdt:client:returnAllPrisoners', src, prisoners, probations)
		
	end
end)


RegisterNetEvent('mdt:server:getAllWeapons', function()
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		local matches = MySQL.query.await("SELECT DISTINCT serialnumber FROM mdt_weaponregistryevent ORDER BY id DESC LIMIT 30;", {
		})
		TriggerClientEvent('mdt:client:getAllWeapons', src, matches)
	end
end)


RegisterNetEvent('mdt:server:getWeaponData', function(sentSerialNumber)
	if sentSerialNumber then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local matches = MySQL.query.await("SELECT * FROM mdt_weaponregistryevent WHERE serialnumber = :sentSerial;", {
				sentSerial = sentSerialNumber
			})
			local data = matches
			--data['personsinvolved'] = json.decode(data['personsinvolved'])
			TriggerClientEvent('mdt:client:getWeaponData', src, data)
			
		end
	end
end)
RegisterNetEvent('mdt:server:getWeaponEvent', function(sentId)
	if sentId then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local matches = MySQL.query.await("SELECT * FROM mdt_weaponregistryevent WHERE id = :sentid;", {
				sentid = sentId
			})
			local data = matches[1]
			data['personsinvolved'] = json.decode(data['personsinvolved'])
			TriggerClientEvent('mdt:client:getWeaponEventData', src, data)
			
		end
	end
end)
RegisterNetEvent('mdt:server:searchWeapons', function(sentSearchserialnumber)
	if sentSearchserialnumber then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local matches = MySQL.query.await("SELECT serialnumber FROM mdt_weaponregistryevent WHERE serialnumber = :serialnumber ORDER BY id DESC LIMIT 1;" , {
				serialnumber = sentSearchserialnumber
			})
			TriggerClientEvent('mdt:client:getAllWeapons', src, matches)
		end
	end
end)

RegisterNetEvent('mdt:server:newWeaponRegEvent', function(existing, id, title, serialnumber, details, tags)
	if id then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local function InsertReport()
				MySQL.insert('INSERT INTO mdt_weaponregistryevent (serialnumber, title, details, personsinvolved) VALUES (:serialnum, :insertTitle, :insertDetails, :personinvolved);', {
					serialnum = serialnumber,
					insertTitle = title,
					insertDetails = details,
					personsinvolved = json.encode(tags),
				
				}, function(r)
					if r then
						local matches = MySQL.query.await("SELECT id FROM mdt_weaponregistryevent WHERE id=(SELECT MAX(id) FROM mdt_weaponregistryevent);")
						TriggerClientEvent('mdt:client:weaponsComplete', src, matches, true)
					end
				end)
			end

				local function UpdateReport()
					MySQL.update("UPDATE mdt_weaponregistryevent SET title = :insertTitle, details = :insertDetails, personsinvolved = :tags WHERE id = :id LIMIT 1", {
						insertTitle = title,
						insertDetails = details,
						tags = json.encode(tags),
						id = id,
					}, function(affectedRows)
						if affectedRows > 0 then
							TriggerClientEvent('mdt:client:weaponsComplete', src, id, false)
							
						end
					end)
				end

				if existing then
					UpdateReport()
				elseif not existing then
					InsertReport()	
				end
			
		end
	end
end)


RegisterNetEvent('mdt:server:newWarrant', function(cid, incidentNum, reportNum, duration, details, warrantId)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)

	if Player then
		print("approve or create warrant ", warrantId)
		if warrantId and warrantId>0 then
			--trying to approve an existing warrant
			
			MySQL.insert('UPDATE mdt_warrants SET state = 1 WHERE id = :sentId;', {
				sentId = warrantId,
			}, function(r)
				if r then
					TriggerClientEvent('mdt:client:warrantsComplete', src)
				end
			end)
		else
			MySQL.insert('INSERT INTO mdt_warrants (cid, linkedincident, linkedreport, state, time, duration, details) VALUES (:sentCid, :sentInc, :sentRep, :sentState, :sentTime, :sentDur, :sentDetails);', {
				sentCid = cid,
				sentInc = tonumber(incidentNum),
				sentRep = tonumber(reportNum),
				sentState = 0,
				sentTime = os.time()*1000,
				sentDur = tonumber(duration),
				sentDetails = details,
			
			}, function(r)
				if r then
					TriggerClientEvent('mdt:client:warrantsComplete', src)
				end
			end)
		end
		

	end
end)



RegisterNetEvent('mdt:server:removeWarrant', function(warrantId)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)

	if Player then
		if warrantId then
			--trying to approve an existing warrant
			MySQL.insert('DELETE FROM mdt_warrants WHERE id=:sentId;', {
				sentId = warrantId,
			
			}, function(r)
				if r then
					TriggerClientEvent('mdt:client:warrantsComplete', src)
				end
			end)
		end
		
	end
end)



QBCore.Functions.CreateCallback('mdt:server:SearchVehicles', function(source, cb, sentData)
	if not sentData then  return cb({}) end
	local src = source
	local PlayerData = GetPlayerData(src)
	if not PermCheck(source, PlayerData) then return cb({}) end

	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		local JobType = GetJobType(Player.PlayerData.job.name)
		if IsPolice(JobType) then
			local vehicles = MySQL.query.await("SELECT pv.id, pv.citizenid, pv.plate, pv.vehicle, pv.mods, pv.state, p.charinfo FROM `player_vehicles` pv LEFT JOIN players p ON pv.citizenid = p.citizenid WHERE LOWER(`plate`) LIKE :query OR LOWER(`vehicle`) LIKE :query LIMIT 25", {
				query = string.lower('%'..sentData..'%')
			})

			if not next(vehicles) then cb({}) return end

			for _, value in ipairs(vehicles) do
				if value.state == 0 then
					value.state = "Out"
				elseif value.state == 1 then
					value.state = "Garaged"
				elseif value.state == 2 then
					value.state = "Impounded"
				end

				value.bolo = false
				local boloResult = GetBoloStatus(value.plate)
				if boloResult then
					value.bolo = true
				end

				value.code = false
				value.stolen = false
				value.image = "img/not-found.webp"
				local info = GetVehicleInformation(value.plate)[1]
				if info then
					value.code = info['code5']
					value.stolen = info['stolen']
					if info['image'] then value.image = info['image'] end
				end

				local ownerResult = json.decode(value.charinfo)
				
				value.owner = ownerResult['firstname'] .. " " .. ownerResult['lastname']
			end
			-- idk if this works or I have to call cb first then return :shrug:
			return cb(vehicles)
		end

		return cb({})
	end

end)

RegisterNetEvent('mdt:server:getVehicleData', function(plate)
	if plate then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			local JobType = GetJobType(Player.PlayerData.job.name)
			if IsPolice(JobType) then
				local vehicle = MySQL.query.await("select pv.*, p.charinfo from player_vehicles pv LEFT JOIN players p ON pv.citizenid = p.citizenid where pv.plate = :plate LIMIT 1", { plate = string.gsub(plate, "^%s*(.-)%s*$", "%1")})
				if vehicle and vehicle[1] then
					vehicle[1]['impound'] = false
					if vehicle[1].state == 2 then
						vehicle[1]['impound'] = true
					end

					vehicle[1]['bolo'] = GetBoloStatus(vehicle[1]['plate'])
					vehicle[1]['information'] = ""

					vehicle[1]['name'] = "Unknown Person"

					local ownerResult = json.decode(vehicle[1].charinfo)
					vehicle[1]['name'] = ownerResult['firstname'] .. " " .. ownerResult['lastname']

					local color1 = json.decode(vehicle[1].mods)
					vehicle[1]['color1'] = color1['color1']

					vehicle[1]['dbid'] = 0

					vehicle[1]['image'] = "img/not-found.webp"
					local info = GetVehicleInformation(vehicle[1]['plate'])[1]
					if info then
						vehicle[1]['information'] = info['information']
						vehicle[1]['dbid'] = info['id']
						if info['image'] then vehicle[1]['image'] = info['image'] end
						vehicle[1]['code'] = info['code5']
						vehicle[1]['stolen'] = info['stolen']
						vehicle[1]['strikes'] = info['strikes']
					end

				end

				TriggerClientEvent('mdt:client:getVehicleData', src, vehicle)
			end
		end
	end
end)

RegisterNetEvent('mdt:server:saveVehicleInfo', function(dbid, plate, imageurl, notes, stolen, code5, impoundInfo, strikes)
	if plate then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			if IsPolice(Player.PlayerData.job.name) then
				if dbid == nil then dbid = 0 end;
				local fullname = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
				--TriggerEvent('mdt:server:AddLog', "A vehicle with the plate ("..plate..") has a new image ("..imageurl..") edited by "..fullname)
				if tonumber(dbid) == 0 then
					MySQL.insert('INSERT INTO `mdt_vehicleinfo` (`plate`, `information`, `image`, `code5`, `stolen`, `strikes`) VALUES (:plate, :information, :image, :code5, :stolen, :strikes)', { plate = string.gsub(plate, "^%s*(.-)%s*$", "%1"), information = notes, image = imageurl, code5 = code5, stolen = stolen, strikes=strikes }, function(infoResult)
						if infoResult then
							TriggerClientEvent('mdt:client:updateVehicleDbId', src, infoResult)
							--TriggerEvent('mdt:server:AddLog', "A vehicle with the plate ("..plate..") was added to the vehicle information database by "..fullname)
						end
					end)
				elseif tonumber(dbid) > 0 then
					MySQL.update("UPDATE mdt_vehicleinfo SET `information`= :information, `image`= :image, `code5`= :code5, `stolen`= :stolen, `strikes`=:strikes WHERE `plate`= :plate LIMIT 1", { plate = string.gsub(plate, "^%s*(.-)%s*$", "%1"), information = notes, image = imageurl, code5 = code5, stolen = stolen, strikes=strikes})
				end
				/*
				if impoundInfo.impoundChanged then
					local vehicle = MySQL.single.await("SELECT p.id, p.plate, i.vehicleid AS impoundid FROM `player_vehicles` p LEFT JOIN `mdt_impound` i ON i.vehicleid = p.id WHERE plate=:plate", { plate = string.gsub(plate, "^%s*(.-)%s*$", "%1") })
					if impoundInfo.impoundActive then
						local plate, linkedreport, fee, time = impoundInfo['plate'], impoundInfo['linkedreport'], impoundInfo['fee'], impoundInfo['time']
						if (plate and linkedreport and fee and time) then
							if vehicle.impoundid == nil then
								-- This section is copy pasted from request impound and needs some attention.
								-- sentVehicle doesnt exist.
								-- data is defined twice
								-- INSERT INTO will not work if it exists already (which it will)
								local data = vehicle
								MySQL.insert('INSERT INTO `mdt_impound` (`vehicleid`, `linkedreport`, `fee`, `time`) VALUES (:vehicleid, :linkedreport, :fee, :time)', {
									vehicleid = data['id'],
									linkedreport = linkedreport,
									fee = fee,
									time = os.time() + (time * 60)
								}, function(res)
									-- notify?
									local data = {
										vehicleid = data['id'],
										plate = plate,
										beingcollected = 0,
										vehicle = sentVehicle,
										officer = Player.PlayerData.charinfo.firstname.. " "..Player.PlayerData.charinfo.lastname,
										number = Player.PlayerData.charinfo.phone,
										time = os.time() * 1000,
										src = src,
									}
									local vehicle = NetworkGetEntityFromNetworkId(sentVehicle)
									FreezeEntityPosition(vehicle, true)
									impound[#impound+1] = data

									TriggerClientEvent("police:client:ImpoundVehicle", src, true, fee)
								end)
								-- Read above comment
							end
						end
					else
						if vehicle.impoundid ~= nil then
							local data = vehicle
							local result = MySQL.single.await("SELECT id, vehicle, fuel, engine, body FROM `player_vehicles` WHERE plate=:plate LIMIT 1", { plate = string.gsub(plate, "^%s*(.-)%s*$", "%1")})
							if result then
								local data = result
								MySQL.update("DELETE FROM `mdt_impound` WHERE vehicleid=:vehicleid", { vehicleid = data['id'] })

								result.currentSelection = impoundInfo.CurrentSelection
								result.plate = plate
								TriggerClientEvent('ps-mdt:client:TakeOutImpound', src, result)
							end

						end
					end
				end
				*/
			end
		end
	end
end)

-- Penal Code

local function IsCidFelon(sentCid, cb)
	if sentCid then
		local convictions = MySQL.query.await('SELECT charges FROM mdt_convictions WHERE cid=:cid', { cid = sentCid })
		local Charges = {}
		for i=1, #convictions do
			local currCharges = json.decode(convictions[i]['charges'])
			for x=1, #currCharges do
				Charges[#Charges+1] = currCharges[x]
			end
		end
		local PenalCode = Config.PenalCode
		for i=1, #Charges do
			for p=1, #PenalCode do
				for x=1, #PenalCode[p] do
					if PenalCode[p][x]['title'] == Charges[i] then
						if PenalCode[p][x]['class'] == 'Felony' then
							cb(true)
							return
						end
						break
					end
				end
			end
		end
		cb(false)
	end
end

exports('IsCidFelon', IsCidFelon) -- exports['erp_mdt']:IsCidFelon()

RegisterCommand("isfelon", function(source, args, rawCommand)
	IsCidFelon(1998, function(res)
	end)
end, false)

RegisterNetEvent('mdt:server:getPenalCode', function()
	local src = source
	TriggerClientEvent('mdt:client:getPenalCode', src, Config.PenalCodeTitles, Config.PenalCode)
end)

RegisterNetEvent('mdt:server:setCallsign', function(cid, newcallsign)
	local Player = QBCore.Functions.GetPlayerByCitizenId(cid)
	Player.Functions.SetMetaData("callsign", newcallsign)
end)


RegisterNetEvent('mdt:server:saveIncident', function(id, title, information, tags, officers, civilians, evidence, associated, time)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		if GetJobType(Player.PlayerData.job.name) == 'police'  then
			if id == 0 then
				local fullname = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname
				MySQL.insert('INSERT INTO `mdt_incidents` (`author`, `title`, `details`, `tags`, `officersinvolved`, `civsinvolved`, `evidence`, `time`) VALUES (:author, :title, :details, :tags, :officersinvolved, :civsinvolved, :evidence, :time)',
				{
					author = fullname,
					title = title,
					details = information,
					tags = json.encode(tags),
					officersinvolved = json.encode(officers),
					civsinvolved = json.encode(civilians),
					evidence = json.encode(evidence),
					time = time,
				}, function(infoResult)
					if infoResult then
						for i=1, #associated do
							MySQL.insert('INSERT INTO `mdt_convictions` (`cid`, `linkedincident`, `probation`, `guilty`, `processed`, `associated`, `charges`, `fine`, `sentence`, `recfine`, `recsentence`, `time`) VALUES (:cid, :linkedincident, :probation, :guilty, :processed, :associated, :charges, :fine, :sentence, :recfine, :recsentence, :time)', {
								cid = associated[i]['Cid'],
								linkedincident = infoResult,
								probation = associated[i]['Probation'],
								guilty = associated[i]['Guilty'],
								processed = associated[i]['Processed'],
								associated = associated[i]['Isassociated'],
								charges = json.encode(associated[i]['Charges']),
								fine = tonumber(associated[i]['Fine']),
								sentence = tonumber(associated[i]['Sentence']),
								recfine = tonumber(associated[i]['recfine']),
								recsentence = tonumber(associated[i]['recsentence']),
								time = time
							})
							
							Player.Functions.SetMetaData("onprobation", associated[i]['Probation'])

						end
						TriggerClientEvent('mdt:client:updateIncidentDbId', src, infoResult)
						--TriggerEvent('mdt:server:AddLog', "A vehicle with the plate ("..plate..") was added to the vehicle information database by "..player['fullname'])
					end
				end)
			elseif id > 0 then
				MySQL.update("UPDATE mdt_incidents SET title=:title, details=:details, civsinvolved=:civsinvolved, tags=:tags, officersinvolved=:officersinvolved, evidence=:evidence WHERE id=:id", {
					title = title,
					details = information,
					tags = json.encode(tags),
					officersinvolved = json.encode(officers),
					civsinvolved = json.encode(civilians),
					evidence = json.encode(evidence),
					id = id
				})
				for i=1, #associated do
					TriggerEvent('mdt:server:handleExistingConvictions', associated[i], id, time)
					Player.Functions.SetMetaData("onprobation", associated[i]['Probation'])
				end
			end
		end
	end
end)

RegisterNetEvent('mdt:server:handleExistingConvictions', function(data, incidentid, time)
	MySQL.query('SELECT * FROM mdt_convictions WHERE cid=:cid AND linkedincident=:linkedincident', {
		cid = data['Cid'],
		linkedincident = incidentid
	}, function(convictionRes)
		if convictionRes and convictionRes[1] and convictionRes[1]['id'] then
			MySQL.update('UPDATE mdt_convictions SET cid=:cid, linkedincident=:linkedincident, probation=:probation, guilty=:guilty, processed=:processed, associated=:associated, charges=:charges, fine=:fine, sentence=:sentence, recfine=:recfine, recsentence=:recsentence WHERE cid=:cid AND linkedincident=:linkedincident', {
				cid = data['Cid'],
				linkedincident = incidentid,
				probation = data['Probation'],
				guilty = data['Guilty'],
				processed = data['Processed'],
				associated = data['Isassociated'],
				charges = json.encode(data['Charges']),
				fine = tonumber(data['Fine']),
				sentence = tonumber(data['Sentence']),
				recfine = tonumber(data['recfine']),
				recsentence = tonumber(data['recsentence']),
			})
		else
			MySQL.insert('INSERT INTO `mdt_convictions` (`cid`, `linkedincident`, `probation`, `guilty`, `processed`, `associated`, `charges`, `fine`, `sentence`, `recfine`, `recsentence`, `time`) VALUES (:cid, :linkedincident, :probation, :guilty, :processed, :associated, :charges, :fine, :sentence, :recfine, :recsentence, :time)', {
				cid = data['Cid'],
				linkedincident = incidentid,
				probation = data['Probation'],
				guilty = data['Guilty'],
				processed = data['Processed'],
				associated = data['Isassociated'],
				charges = json.encode(data['Charges']),
				fine = tonumber(data['Fine']),
				sentence = tonumber(data['Sentence']),
				recfine = tonumber(data['recfine']),
				recsentence = tonumber(data['recsentence']),
				time = time
			})
		end
	end)
end)

RegisterNetEvent('mdt:server:removeIncidentCriminal', function(cid, incident)
	MySQL.update('DELETE FROM mdt_convictions WHERE cid=:cid AND linkedincident=:linkedincident', {
		cid = cid,
		linkedincident = incident
	})
end)

RegisterNetEvent('mdt:server:deleteIncident', function(cid, incident)
	MySQL.update('DELETE FROM mdt_convictions WHERE cid=:cid AND linkedincident=:linkedincident', {
		cid = cid,
		linkedincident = incident
	})
	MySQL.update('DELETE FROM mdt_incidents WHERE id=:sentId', {
		sentId = incident
	})
end)

RegisterNetEvent('mdt:server:deletReport', function(cid, report)
	MySQL.update('DELETE FROM mdt_reports WHERE id=:sentId', {
		sentId = report
	})
end)


RegisterNetEvent('mdt:server:trackPerson', function(personCID)
	local src = source
	local Target = QBCore.Functions.GetPlayerByCitizenId(personCID)
	if Target then
		local PlayerCoords = GetEntityCoords(GetPlayerPed(Target.PlayerData.source))
		TriggerClientEvent('mdt:client:setWaypointCoord', src, PlayerCoords)
		TriggerClientEvent("QBCore:Notify", src, 'GPS Location marked.', 'error')
	else
		TriggerClientEvent("QBCore:Notify", src, 'Person is at home.', 'error')
	end
end)

RegisterNetEvent('mdt:server:endProbation', function(personCID)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	Player.Functions.SetMetaData("onprobation", false)
end)
-- Dispatch

RegisterNetEvent('mdt:server:setWaypoint', function(callid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(source)
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance'   then
		if callid then
			local calls = exports['ps-dispatch']:GetDispatchCalls()
			TriggerClientEvent('mdt:client:setWaypoint', src, calls[callid])
		end
	end
end)

RegisterNetEvent('mdt:server:callDetach', function(callid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local playerdata = {
		fullname = Player.PlayerData.charinfo.firstname.. " "..Player.PlayerData.charinfo.lastname,
		job = Player.PlayerData.job,
		cid = Player.PlayerData.citizenid,
		callsign = Player.PlayerData.metadata.callsign
	}
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance' then
		if callid then
			TriggerEvent('dispatch:removeUnit', callid, playerdata, function(newNum)
				TriggerClientEvent('mdt:client:callDetach', -1, callid, newNum)
			end)
		end
	end
end)

RegisterNetEvent('mdt:server:callAttach', function(callid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local playerdata = {
		fullname = Player.PlayerData.charinfo.firstname.. " "..Player.PlayerData.charinfo.lastname,
		job = Player.PlayerData.job,
		cid = Player.PlayerData.citizenid,
		callsign = Player.PlayerData.metadata.callsign
	}
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance'  then
		if callid then
			TriggerEvent('dispatch:addUnit', callid, playerdata, function(newNum)
				TriggerClientEvent('mdt:client:callAttach', -1, callid, newNum)
			end)
		end
	end

end)

RegisterNetEvent('mdt:server:attachedUnits', function(callid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance'  then
		if callid then
			local calls = exports['ps-dispatch']:GetDispatchCalls()
			TriggerClientEvent('mdt:client:attachedUnits', src, calls[callid]['units'], callid)
		end
	end
end)

RegisterNetEvent('mdt:server:callDispatchDetach', function(callid, cid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local playerdata = {
		fullname = Player.PlayerData.charinfo.firstname.. " "..Player.PlayerData.charinfo.lastname,
		job = Player.PlayerData.job,
		cid = Player.PlayerData.citizenid,
		callsign = Player.PlayerData.metadata.callsign
	}
	local callid = tonumber(callid)
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance'  then
		if callid then
			TriggerEvent('dispatch:removeUnit', callid, playerdata, function(newNum)
				TriggerClientEvent('mdt:client:callDetach', -1, callid, newNum)
			end)
		end
	end
end)

RegisterNetEvent('mdt:server:setDispatchWaypoint', function(callid, cid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local callid = tonumber(callid)
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance'  then
		if callid then
			local calls = exports['ps-dispatch']:GetDispatchCalls()
			TriggerClientEvent('mdt:client:setWaypoint', src, calls[callid])
		end
	end

end)

RegisterNetEvent('mdt:server:callDragAttach', function(callid, cid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local playerdata = {
		name = Player.PlayerData.charinfo.firstname.. " "..Player.PlayerData.charinfo.lastname,
		job = Player.PlayerData.job.name,
		cid = Player.PlayerData.citizenid,
		callsign = Player.PlayerData.metadata.callsign
	}
	local callid = tonumber(callid)
	local JobType = GetJobType(Player.PlayerData.job.name)
	if JobType == 'police' or JobType == 'ambulance'  then
		if callid then
			TriggerEvent('dispatch:addUnit', callid, playerdata, function(newNum)
				TriggerClientEvent('mdt:client:callAttach', -1, callid, newNum)
			end)
		end
	end
end)

RegisterNetEvent('mdt:server:setWaypoint:unit', function(cid)
	local src = source
	local Player = QBCore.Functions.GetPlayerByCitizenId(cid)
	local PlayerCoords = GetEntityCoords(GetPlayerPed(Player.PlayerData.source))
	TriggerClientEvent("mdt:client:setWaypoint:unit", src, PlayerCoords)
end)

-- Dispatch chat

RegisterNetEvent('mdt:server:sendMessage', function(message, time)
	if not time then 
		time = os.time()
	end
	if not message then 
		message = "blankkneed"
	end
	if message and time then
		local src = source
		local Player = QBCore.Functions.GetPlayer(src)
		if Player then
			MySQL.scalar("SELECT pfp FROM `mdt_data` WHERE cid=:id LIMIT 1", {
				id = Player.PlayerData.citizenid -- % wildcard, needed to search for all alike results
			}, function(data)
				if data == "" then data = nil end
				local ProfilePicture = ProfPic(Player.PlayerData.charinfo.gender, data)
				local callsign = Player.PlayerData.metadata.callsign or "000"
				local Item = {
					profilepic = ProfilePicture,
					callsign = Player.PlayerData.metadata.callsign,
					cid = Player.PlayerData.citizenid,
					name = '('..callsign..') '..Player.PlayerData.charinfo.firstname.. " "..Player.PlayerData.charinfo.lastname,
					message = message,
					time = time,
					job = Player.PlayerData.job.name
				}
				dispatchMessages[#dispatchMessages+1] = Item
				TriggerClientEvent('mdt:client:dashboardMessage', -1, Item)

				-- Send to all clients, for auto updating stuff, ya dig.
			end)
		end
	end
end)

RegisterNetEvent('mdt:server:refreshDispatchMsgs', function()
	local src = source
	local PlayerData = GetPlayerData(src)
	if PlayerData then
		if IsJobAllowedToMDT(PlayerData.job.name) then
			TriggerClientEvent('mdt:client:dashboardMessages', src, dispatchMessages)
		end
	end
end)

RegisterNetEvent('mdt:server:getCallResponses', function(callid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if IsPolice(Player.PlayerData.job.name) then
		local calls = exports['ps-dispatch']:GetDispatchCalls()
		TriggerClientEvent('mdt:client:getCallResponses', src, calls[callid]['responses'], callid)
	end
end)

RegisterNetEvent('mdt:server:sendCallResponse', function(message, time, callid)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	local name = Player.PlayerData.charinfo.firstname.. " "..Player.PlayerData.charinfo.lastname
	if IsPolice(Player.PlayerData.job.name) then
		TriggerEvent('dispatch:sendCallResponse', src, callid, message, time, function(isGood)
			if isGood then
				TriggerClientEvent('mdt:client:sendCallResponse', -1, message, time, callid, name)
			end
		end)
	end
end)

RegisterNetEvent('mdt:server:setRadio', function(cid, newRadio)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player.PlayerData.citizenid ~= cid then
		TriggerClientEvent("QBCore:Notify", src, 'You can only change your radio!', 'error')
		return
	else
		local radio = Player.Functions.GetItemByName("radio")
		if radio ~= nil then
			TriggerClientEvent('mdt:client:setRadio', src, newRadio)
		else
			TriggerClientEvent("QBCore:Notify", src, 'You do not have a radio!', 'error')
		end
	end

end)

local function isRequestVehicle(vehId)
	local found = false
	for i=1, #impound do
		if impound[i]['vehicle'] == vehId then
			found = true
			impound[i] = nil
			break
		end
	end
	return found
end
exports('isRequestVehicle', isRequestVehicle) -- exports['erp_mdt']:isRequestVehicle()

RegisterNetEvent('mdt:server:impoundVehicle', function(sentInfo)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		if IsPolice(Player.PlayerData.job.name) then
			if sentInfo and type(sentInfo) == 'table' then
				local plate, strikes, model = sentInfo['plate'], sentInfo['strikes'], sentInfo['model']

				if (plate and (strikes~=nil) and model) then
					local depotPrice = 0

					if strikes>=0 then depotPrice = 0.1 end
					if strikes>=3 then depotPrice = 0.15 end
					if strikes>=6 then depotPrice = 0.20 end
					if strikes>=9 then depotPrice = 0.25 end

					local finalPrice = QBCore.Shared.Vehicles[model].price * depotPrice

					local vehicle = MySQL.update("UPDATE player_vehicles SET state=2, depotPrice = :sentPrice, garage=police WHERE plate=:plate;", { 
						plate = string.gsub(plate, "^%s*(.-)%s*$", "%1"),
						sentPrice = finalPrice
					})
					

				end
			end
		end
	end
end)

RegisterNetEvent('mdt:server:removeImpound', function(plate, currentSelection)
	local src = source
	local Player = QBCore.Functions.GetPlayer(src)
	if Player then
		if IsPolice(Player.PlayerData.job.name) then
			if sentInfo and type(sentInfo) == 'table' then
				local plate = sentInfo['plate']
				if (plate) then
					local vehicle = MySQL.update("UPDATE player_vehicles SET state=1, depotPrice = 0, garage=police WHERE plate=:plate;", { 
						plate = string.gsub(plate, "^%s*(.-)%s*$", "%1")
					})
					

				end
			end
		end
	end
end)

RegisterServerEvent("mdt:server:AddLog", function(text)
	AddLog(text)
end)

function GetBoloStatus(plate)
    local result = MySQL.query.await("SELECT * FROM mdt_bolos where plate = @plate", {['@plate'] = plate})
	if result and result[1] then
		return true
	end

	return false
end

function GetVehicleInformation(plate)
	local result = MySQL.query.await('CALL `GetVehicleInformation`(@plate);', {['@plate'] = plate})
    if result[1] then
        return result[1]
    else
        return false
    end
end

