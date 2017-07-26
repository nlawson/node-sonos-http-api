'use strict';
const settings = require('../../settings');

const soundcloudDef = {
  country:   '',
  search:    {
               album:   'https://api.soundcloud.com/playlists?client_id=' + settings.soundcloudClientId + '&limit=1&q=',
               song:    'https://api.soundcloud.com/tracks?client_id=' + settings.soundcloudClientId + '&limit=50&q=',
               //station: 'https://api.soundcloud.com/users?client_id=' + settings.soundcloudClientId + '&limit=1&q='
               station: ''
             },
  metastart: {
               album:   '0006206cplaylist%3asoundcloud%3aplaylists%3a', // Playlist, not album
               song:    '00032020track%3a',
               //station: '000f206cuser-tracks%3a'
               station: ''
             },
  parent:    {
               album:   '000d2064user-sets%3a',
               song:   '000f206cuser-tracks%3a',
               //station:   '00052064user%3a'
               station: ''
             },
  object:    {
               album:   'container.playlistContainer.#editorialView',
               song:    'item.audioItem.musicTrack.#editorialViewTracks',
               //station: 'container.playlistContainer.sameArtist.#editorialView'
               station: ''
             },
             
  service:   setService,
  term:      getSearchTerm,
  tracks:    loadTracks,
  empty:     isEmpty,
  metadata:  getMetadata,
  urimeta:   getURIandMetadata           
}  

function getURI(type, id) {
  if (type == 'album') {
    return `x-rincon-cpcontainer:0006206cplaylist%3asoundcloud%3aplaylists%3a${id}`;
  } else if (type == 'song') {
    return `x-sonos-http:track%3a${id}.mp3?sid=${sid}&flags=8224&sn=${accountSN}`;
  } else if (type == 'station') {
    //return `x-rincon-cpcontainer:000f206cuser-tracks%3a${id}`;
	return ``;
  }
}

function getServiceToken() {
  return `SA_RINCON${serviceType}_X_#Svc${serviceType}-0-Token`;
}

var sid = '';
var serviceType = '';
var accountId = '';
var accountSN = '';
var country = '';

function setService(player, p_accountId, p_accountSN, p_country)
{
  sid = player.system.getServiceId('SoundCloud');
  serviceType = player.system.getServiceType('SoundCloud');
  accountId = p_accountId;
  accountSN = p_accountSN;
  country = p_country;
}

function getSearchTerm(type, term, artist, album, track) {
  var newTerm = '';
  
  if (artist != '') {
    newTerm += artist;
  }
  
  if (track != '') {
    newTerm += ' ' + track;
  }

  if (album != '') {
    newTerm += ' ' + album;
  }
  newTerm = encodeURIComponent(newTerm);
  
  return newTerm;
}

function getMetadata(type, id, name, title) {
  const token = getServiceToken();
  const parentUri = soundcloudDef.parent[type] + name;
  const objectType = soundcloudDef.object[type];
  
  if (type != 'station') {
    title = '';
  }

  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
          xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
          <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.${objectType}</upnp:class>
          <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">${token}</desc></item></DIDL-Lite>`;
}

function getURIandMetadata(type, resList)
{
  var Id = '';
  var Title = '';
  var Name = '';
  var MetadataID = '';
  var UaM = {
              uri: '',
              metadata: ''
            };

  Id = resList[0].id;
  Title = (type=='station') ? 'Songs' : resList[0].title;
  Name = (type=='station') ? resList[0].id : resList[0].user_id;
  MetadataID = soundcloudDef.metastart[type] + encodeURIComponent(Id);
  
  UaM.metadata = getMetadata(type, MetadataID, Name, Title); // 
  UaM.uri = getURI(type, encodeURIComponent(Id));
   
  return UaM;
}

function loadTracks(type, tracksJson) {
  var tracks = { count : 0,
                 isArtist : false,
                 queueTracks : []
                };
                
  if (tracksJson.length > 0) {
    // Filtered list of tracks to play
    tracks.queueTracks = tracksJson.reduce(function(tracksArray, track) {
      if (track.streamable) {
        var skip = false;
  
        for (var j=0; (j < tracksArray.length) && !skip ; j++) {
          // Skip duplicate songs
          skip = (track.title == tracksArray[j].trackName);
        }
                    
        if (!skip) {
          var metadataID = soundcloudDef.metastart['song'] + encodeURIComponent(track.id);
          var metadata = getMetadata('song', metadataID, track.user_id, track.title);
          var uri = getURI('song', encodeURIComponent(track.id));

          tracksArray.push({trackName:track.title, artistName:track.user.username, uri:uri, metadata:metadata});
          tracks.count++;
        }
      } 
      return tracksArray;
    }, []);
  }
  
  return tracks;
}
  
function isEmpty(type, resList)
{
  return (resList.length == 0);
}
  
module.exports = soundcloudDef;
  
