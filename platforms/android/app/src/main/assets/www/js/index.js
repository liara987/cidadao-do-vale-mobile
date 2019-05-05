/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);

        // Pegar localização
        navigator.geolocation.getCurrentPosition(
            this.onLocationSuccess,
            this.onLocationError
        );

        $(document).ready(function() {
            $('button.camera-start').on('click', function() {
                app.tirarFoto();
            });

            $('form select#categorias').on('change', function() {
                app.prepararSelectSubCategorias($(this).val());
            });

            app.prepararSelectCategorias();

            $('#contribuir').submit(function(e) {
                e.preventDefault();
                app.salvarContribuicao(e);
            })
        });
    },

    onLocationSuccess: function(position) {
        $('#location').val(JSON.stringify(cloneAsObject(position)));
        console.log(
            'Latitude: '          + position.coords.latitude          + '\n' +
            'Longitude: '         + position.coords.longitude         + '\n' +
            'Altitude: '          + position.coords.altitude          + '\n' +
            'Accuracy: '          + position.coords.accuracy          + '\n' +
            'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
            'Heading: '           + position.coords.heading           + '\n' +
            'Speed: '             + position.coords.speed             + '\n' +
            'Timestamp: '         + position.timestamp                + '\n'
        );
    },

    onLocationError: function(error) {
        alert(
            'code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n'
        );
    },

    tirarFoto: function() {
        navigator.camera.getPicture(
            this.onGetPictureSuccess,
            this.onGetPictureFail,
            {
                quality: 25,
                destinationType: Camera.DestinationType.DATA_URL
                //destinationType: Camera.DestinationType.FILE_URI
            }
        );
    },

    onGetPictureSuccess: function(imageData) {
        var image = document.getElementById('myImage');
        image.src = "data:image/jpeg;base64," + imageData;
    },

    onGetPictureFail: function(message) {
        alert('Failed because: ' + message);
    },

    uploadFoto: function(imageData, fileName) {
        imageData = imageData.replace('data:image/jpeg;base64,', '');
        var ref = firebase.storage().ref('/images/').child(fileName);
        ref.putString(imageData, 'base64', {contentType: 'image/jpg'})
            .then(function(snapshot) {
                alert(snapshot.ref);
                //$('');
                console.log('Uploaded a blob or file!');
            })
            .catch(function(error) {
                console.error("Error adding a file: ", error);
            });
    },

    prepararSelectCategorias: function() {
        db.collection("categorias").get().then(function(categorias) {
            $('form select#categorias').html('');
            $('form select#categorias').append('<option value="">Selecione</option>');
            categorias.forEach(function(categoria) {
                console.log("Categoria: ", categoria.data(), categoria);
                $('form select#categorias').append('<option value="' + categoria.id + '">' + categoria.data().nome + '</option>');
            });
        }).catch(function(error) {
            console.log("Error getting documents:", error);
        });
    },

    prepararSelectSubCategorias: function(id) {
        db.collection("categorias").doc(id.toString()).collection("subcategorias").get().then(function(subcategorias) {
            $('form select#subcategorias').html('');
            $('form select#subcategorias').append('<option value="">Selecione</option>');
            subcategorias.forEach(function(subcategoria) {
                console.log("Sub Categoria: ", subcategoria.data());
                $('form select#subcategorias').append('<option value="' + subcategoria.id + '">' + subcategoria.data().nome + '</option>');
            });
        });
    },

    salvarContribuicao: function(e) {
        console.log(e);

        var form = getFormData($('#contribuir'));
        form.location = JSON.parse(form.location);


        db.collection('contribuicoes').add(form).then(function(snapShot) {
            console.log(snapShot.id);

            var image = document.getElementById('myImage');
            if (image.src)
                app.uploadFoto(image.src, snapShot.id + '.jpg');
        }).catch(function(e) {
            console.log(e);
        });
    }
};


// Initialize Firebase
var config = {
    apiKey: "AIzaSyDeU3iXSkN5zMvk4y14V-Tp3dnv-hPXsw8",
    authDomain: "cidadaodovale-e920b.firebaseapp.com",
    databaseURL: "https://cidadaodovale-e920b.firebaseio.com",
    projectId: "cidadaodovale-e920b",
    storageBucket: "cidadaodovale-e920b.appspot.com",
    messagingSenderId: "927504849509"
};
firebase.initializeApp(config);

var db = firebase.firestore();
//var storage = firebase.app().storage("gs://cidadaodovale-e920b.appspot.com");
var storage = firebase.storage();

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in.
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        console.log(isAnonymous, uid, user);
        // ...
    } else {
        firebase.auth().signInAnonymously().catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode, errorMessage);
            // ...
        });
    }
    // ...
});

app.initialize();

function cloneAsObject(obj) {
    if (obj === null || !(obj instanceof Object)) {
        return obj;
    }
    var temp = (obj instanceof Array) ? [] : {};
    // ReSharper disable once MissingHasOwnPropertyInForeach
    for (var key in obj) {
        temp[key] = cloneAsObject(obj[key]);
    }
    return temp;
}

function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}



//if (doc.exists) {
//} else {
    // doc.data() will be undefined in this case
    //console.log("No such document!");
//}
/*
## Criar categorias
$.each(categorias, function(keyCategoria, categoria) {
    db.collection("categorias").doc(keyCategoria).set({'nome': categoria.nome});
    $.each(categoria.subcategorias, function(keySubCategoria, subcategoria) {
        db.collection("categorias").doc(keyCategoria).collection('subcategorias').doc(keySubCategoria).set(subcategoria)
    });
});
*/
