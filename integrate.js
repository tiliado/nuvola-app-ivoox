/*
 * Copyright 2019 Jiří Janoušek <janousek.jiri@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

(function (Nuvola) {
  var PlaybackState = Nuvola.PlaybackState
  var PlayerAction = Nuvola.PlayerAction
  var player = Nuvola.$object(Nuvola.MediaPlayer)

  var WebApp = Nuvola.$WebApp()

  WebApp._onInitWebWorker = function (emitter) {
    Nuvola.WebApp._onInitWebWorker.call(this, emitter)

    var state = document.readyState
    if (state === 'interactive' || state === 'complete') {
      this._onPageReady()
    } else {
      document.addEventListener('DOMContentLoaded', this._onPageReady.bind(this))
    }
  }

  WebApp._onPageReady = function () {
    Nuvola.actions.connect('ActionActivated', this)
    this.update()
  }

  WebApp.update = function () {
    var elms = this._getElements()
    var track = {
      title: Nuvola.queryText('#main .top-header .title h1'),
      artist: null,
      album: null,
      artLocation: Nuvola.queryAttribute('#main img.main', 'src'),
      rating: null,
      length: elms.timeTotal
    }

    var state
    if (elms.pause) {
      state = PlaybackState.PLAYING
    } else if (elms.play) {
      state = PlaybackState.PAUSED
    } else {
      state = PlaybackState.UNKNOWN
    }

    player.setPlaybackState(state)
    player.setTrack(track)
    player.setCanGoPrev(false)
    player.setCanGoNext(false)
    player.setCanPlay(!!elms.play)
    player.setCanPause(!!elms.pause)
    player.setTrackPosition(elms.timeElapsed)
    player.setCanSeek(state !== PlaybackState.UNKNOWN && elms.seekBar)

    setTimeout(this.update.bind(this), 500)
  }

  WebApp._onActionActivated = function (emitter, name, param) {
    var elms = this._getElements()
    switch (name) {
      case PlayerAction.TOGGLE_PLAY:
        if (elms.play) {
          Nuvola.clickOnElement(elms.play)
        } else {
          Nuvola.clickOnElement(elms.pause)
        }
        break
      case PlayerAction.PLAY:
        Nuvola.clickOnElement(elms.play)
        break
      case PlayerAction.PAUSE:
      case PlayerAction.STOP:
        Nuvola.clickOnElement(elms.pause)
        break
      case PlayerAction.SEEK:
        var total = Nuvola.parseTimeUsec(elms.timeTotal)
        if (param > 0 && param <= total) {
          Nuvola.clickOnElement(elms.seekBar, param / total, 0.5)
        }
        break
    }
  }

  WebApp._getElements = function () {
    var elms = {
      play: document.querySelector('.button .play > a'),
      pause: document.querySelector('.button .stop > a'),
      timeElapsed: Nuvola.queryText('.player-timebar .time'),
      timeTotal: Nuvola.queryText('.player-timebar .total-time'),
      seekBar: document.querySelector('.player-timebar .buffer-timebar')
    }
    for (var key of ['play', 'pause']) {
      if (elms[key] && elms[key].parentElement.style.display === 'none') {
        elms[key] = null
      }
    }
    return elms
  }

  WebApp.start()
})(this) // function(Nuvola)
