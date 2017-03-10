'use strict';
function getMetadata(id, parentUri, type, title) {
  // parentID (${parentUri}) & desc (SA_RINCON40967_X_#Svc40967-0-Token) values don't really matter here
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
  xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.${type}</upnp:class>
  <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON40967_X_#Svc40967-0-Token</desc></item></DIDL-Lite>`;
}

function getSongUri(id) {
  return `x-sonos-http:track%3a${id}.mp3?sid=160&amp;flags=8224&amp;sn=3`;
}

function getAlbumUri(id) {
  return `x-rincon-cpcontainer:0006206cplaylist%3asoundcloud%3aplaylists%3a${id}`;
}

const uriTemplates = {
  song: getSongUri,
  album: getAlbumUri
};

const CLASSES = {
  song: 'item.audioItem.musicTrack.#editorialViewTracks',
  album: 'container.playlistContainer.#editorialView'
};

const METADATA_URI_STARTERS = {
  song: '00032020track%3a',
  album: '0006206cplaylist%3asoundcloud%3aplaylists%3a'
};

const PARENTS = {
  song: '000f206cuser-tracks%3a',
  album: '000d2064user-sets%3a'
};

function soundcloud(player, values) {
  const action = values[0];
  const track = values[1];
  const type = track.split(':')[0];
  const trackID = track.split(':')[1];
  var nextTrackNo = 0;

  const metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent(trackID);
  const metadata = getMetadata(metadataID, PARENTS[type], CLASSES[type], '');
  const uri = uriTemplates[type](encodeURIComponent(trackID));
  player.getQueue().then(function(results){
	  console.log(results.length);
  });
  
  if (action == 'queue') {
    return player.coordinator.addURIToQueue(uri, metadata);
  } else if (action == 'now') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo)
      .then(() => {
        player.getQueue().then(function(results){
          // if there is nothing in the queue, don't go to the 
		  // next track because we will be at the end of the queue
          if(results.length > 0)
            player.coordinator.nextTrack()
        });
	  })
      .then(() => player.coordinator.play());
  } else if (action == 'next') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }
}

module.exports = function (api) {
  api.registerAction('soundcloud', soundcloud);
}
