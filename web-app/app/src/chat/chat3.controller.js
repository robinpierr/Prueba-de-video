/**
 * @ngdoc controller
 * @name app.chat.controller:Chat
 * @description < description placeholder >
 */

(function(){

  'use strict';

  angular
    .module('app.chat')
    .controller('Chat3', Chat);

  /* @ngInject */
  function Chat(socket){
    var vm = this;
    //var constraints = {audio:true, video: true};
    var constraints = { video: true};
    vm.roomName = '';
    vm.userSocket = '';
    vm.testVideo = '';
    vm.receiveBtn = false;
    var testVideo = document.querySelector('#testVideo');

    vm.addMeToSocket = addMeToSocket;
    vm.roomCreateJoin = roomCreateJoin;
    vm.createCall = createCall;
    vm.receiveCall = receiveCall;
    vm.rejectCall = rejectCall;
    vm.addVideo = addVideo;

    /////////////////////

    /**
     * @ngdoc method
     * @name testFunction
     * @param {number} num number is the number of the number
     * @methodOf app.chat.controller:Chat
     * @description
     * My Description rules
     */
    function addMeToSocket(num){
      socket.emit('register',{id:Math.floor((Math.random() * 100) + 1)})
    }

    socket.on('registeredToSocket',function(data){
      //console.log(data);
    });

    socket.on('listOfOnlineUser',function(data){
      vm.listOfOnlineUser = data;
    });

    function createCall(){
      socket.emit('createCall',{userSocketID: vm.userSocket})
    }

    socket.on('inComingCall', function(data){
      console.log('inComingCall');
      vm.receiveBtn = true;
      vm.callInfo = data;
    });

    function receiveCall(){
      socket.emit('callAccepted',vm.callInfo);
      isChannelReady = true;
      gotStream(vm.myStream)
    }

    function rejectCall(){
      socket.emit('callReject',vm.callInfo)
    }

    socket.on('callRejectedByUser',function(){
      console.log('callRejectedByUser');
      vm.message = 'User Rejected Your Call';
    });

    socket.on('callAcceptedByUser',function(){
      isInitiator = true;
      isChannelReady = true;
      gotStream(vm.myStream)
    });

    function addVideo(){
      testVideo.src = vm.testVideo;
    }







    ///Audio/Video Capture


    var isChannelReady = false;
    var isInitiator = false;
    var isStarted = false;
    var localStream;
    var pc;
    var remoteStream;
    var turnReady;
    vm.myStream;

    var pcConfig = {
      'iceServers': [
        {
          'url': 'stun:stun.l.google.com:19302'
        },
        {url:'stun:stun.l.google.com:19302'},
  {url:'stun:stun1.l.google.com:19302'},
  {url:'stun:stun2.l.google.com:19302'},
  {url:'stun:stun3.l.google.com:19302'},
  {url:'stun:stun4.l.google.com:19302'},
        {
          url: 'turn:numb.viagenie.ca',
          credential: 'freelancerjob2',
          username: 'muddassir_92@hotmail.com'
        }
        //},
        //{
        //  url: 'turn:numb.viagenie.ca',
        //  credential: 'muazkh',
        //  username: 'webrtc@live.com'
        //},
        //{
        //  url: 'turn:192.158.29.39:3478?transport=udp',
        //  credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        //  username: '28224511:1379330808'
        //},
        //{
        //  url: 'turn:192.158.29.39:3478?transport=tcp',
        //  credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        //  username: '28224511:1379330808'
        //}
      ]
    };

// Set up audio and video regardless of what devices are present.
    var sdpConstraints = {
      'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
      }
    };

/////////////////////////////////////////////

//var room = 'foo';
// Could prompt for room name:
    var room; //= prompt('Enter room name:');

    //var socket = io.connect();

    function roomCreateJoin(){
      if (vm.roomName !== '') {
        socket.emit('create or join', vm.roomName);
        console.log('Attempted to create or  join room', vm.roomName);
      }

    }


    socket.on('created', function(room) {
      console.log('Created room ' + room);
      isInitiator = true;
      gotStream(vm.myStream)
    });

    socket.on('full', function(room) {
      console.log('Room ' + room + ' is full');
    });

    socket.on('join', function (room){
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      isChannelReady = true;
    });

    socket.on('joined', function(room) {
      console.log('joined: ' + room);
      isChannelReady = true;
      gotStream(vm.myStream);
    });

    socket.on('log', function(array) {
      console.log.apply(console, array);
    });

////////////////////////////////////////////////

    function sendMessage(message) {
      console.log('Client sending message: ', message);
      socket.emit('message', message);
    }

// This client receives a message
    socket.on('message', function(message) {
      console.log('Client received message:', message);
      if (message === 'got user media') {
        maybeStart();
      } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
          maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
      }
    });

////////////////////////////////////////////////////

    var localVideo = document.querySelector('#localVideo');
    var remoteVideo = document.querySelector('#remoteVideo');

    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    })
      .then(function(stream){
        window.localStream = localStream = stream;
      })
      .catch(function(e) {
        alert('getUserMedia() error: ' + e.name);
      });

    function gotStream(stream) {
      console.log('Adding local stream.');
      localVideo.src = window.URL.createObjectURL(window.localStream);
      //localStream = stream;
      sendMessage('got user media');
      if (isInitiator) {
        maybeStart();
      }
    }

    //if (location.hostname !== 'localhost') {
    //  requestTurn(
    //    'https://numb.viagenie.ca/turn?username=muddassir_92@hotmail.com&key=karachijob'
    //  );
    //}

    function maybeStart() {
      console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
      if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
          doCall();
        }
      }
    }

    window.onbeforeunload = function() {
      sendMessage('bye');
    };

/////////////////////////////////////////////////////////

    function createPeerConnection() {
      try {
        pc = new RTCPeerConnection(pcConfig,{ optional : [{"googIPv6": true}]});
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
      } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
      }
    }

    function handleIceCandidate(event) {
      console.log('icecandidate event: ', event);
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('End of candidates.');
      }
    }

    function handleRemoteStreamAdded(event) {
      console.log('Remote stream added.');
      window.remoteStream = remoteStream = event.stream;
      console.log(window.URL.createObjectURL(event.stream));
      remoteVideo.src = window.URL.createObjectURL(event.stream);
    }

    function handleCreateOfferError(event) {
      console.log('createOffer() error: ', event);
    }

    function doCall() {
      console.log('Sending offer to peer');
      pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }

    function doAnswer() {
      console.log('Sending answer to peer.');
      pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
      );
    }

    function setLocalAndSendMessage(sessionDescription) {
      // Set Opus as the preferred codec in SDP if Opus is present.
      //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
      pc.setLocalDescription(sessionDescription);
      console.log('setLocalAndSendMessage sending message', sessionDescription);
      sendMessage(sessionDescription);
    }

    function onCreateSessionDescriptionError(error) {
      trace('Failed to create session description: ' + error.toString());
    }

    function requestTurn(turnURL) {
      var turnExists = false;
      for (var i in pcConfig.iceServers) {
        if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
          turnExists = true;
          turnReady = true;
          break;
        }
      }
      if (!turnExists) {
        console.log('Getting TURN server from ', turnURL);
        // No TURN server. Get one from computeengineondemand.appspot.com:
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            var turnServer = JSON.parse(xhr.responseText);
            console.log('Got TURN server: ', turnServer);
            pcConfig.iceServers.push({
              'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
              'credential': turnServer.password
            });
            turnReady = true;
          }
        };
        xhr.open('GET', turnURL, true);
        xhr.send();
      }
    }


    function handleRemoteStreamRemoved(event) {
      console.log('Remote stream removed. Event: ', event);
    }

    function hangup() {
      console.log('Hanging up.');
      stop();
      sendMessage('bye');
    }

    function handleRemoteHangup() {
      console.log('Session terminated.');
      stop();
      isInitiator = false;
    }

    function stop() {
      isStarted = false;
      // isAudioMuted = false;
      // isVideoMuted = false;
      pc.close();
      pc = null;
    }

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
    function preferOpus(sdp) {
      var sdpLines = sdp.split('\r\n');
      var mLineIndex;
      // Search for m line.
      for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
          mLineIndex = i;
          break;
        }
      }
      if (mLineIndex === null) {
        return sdp;
      }

      // If Opus is available, set it as the default in m line.
      for (i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('opus/48000') !== -1) {
          var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
          if (opusPayload) {
            sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
              opusPayload);
          }
          break;
        }
      }

      // Remove CN in m line and sdp.
      sdpLines = removeCN(sdpLines, mLineIndex);

      sdp = sdpLines.join('\r\n');
      return sdp;
    }

    function extractSdp(sdpLine, pattern) {
      var result = sdpLine.match(pattern);
      return result && result.length === 2 ? result[1] : null;
    }

// Set the selected codec to the first in m line.
    function setDefaultCodec(mLine, payload) {
      var elements = mLine.split(' ');
      var newLine = [];
      var index = 0;
      for (var i = 0; i < elements.length; i++) {
        if (index === 3) { // Format of media starts from the fourth.
          newLine[index++] = payload; // Put target payload to the first.
        }
        if (elements[i] !== payload) {
          newLine[index++] = elements[i];
        }
      }
      return newLine.join(' ');
    }

// Strip CN from sdp before CN constraints is ready.
    function removeCN(sdpLines, mLineIndex) {
      var mLineElements = sdpLines[mLineIndex].split(' ');
      // Scan from end for the convenience of removing an item.
      for (var i = sdpLines.length - 1; i >= 0; i--) {
        var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload) {
          var cnPos = mLineElements.indexOf(payload);
          if (cnPos !== -1) {
            // Remove CN payload from m line.
            mLineElements.splice(cnPos, 1);
          }
          // Remove CN line in sdp
          sdpLines.splice(i, 1);
        }
      }

      sdpLines[mLineIndex] = mLineElements.join(' ');
      return sdpLines;
    }


  }

}());
