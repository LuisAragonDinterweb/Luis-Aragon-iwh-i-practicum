const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const HUBSPOT_API_URL = "https://api.hubapi.com";
const PRIVATE_APP_ACCESS = process.env.HUBSPOT_ACCESS_TOKEN;
const CUSTOM_OBJECT_NAME = process.env.CUSTOM_OBJECT_NAME;

// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${HUBSPOT_API_URL}/crm/v3/objects/${CUSTOM_OBJECT_NAME}?properties=name,species,race`, {
            headers: {
                Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data.results;
        res.render('homepage', { title: 'Mascotas', data });
    } catch (error) {
        console.error('Error al obtener datos:', error.response?.data || error.message);
        res.status(500).send('Error al obtener datos de mascotas');
    }
});


// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

app.get('/update-cobj', (req, res) => {
    res.render('updates', { title: 'Actualizar Mascotas' });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.

app.post('/update-cobj', async (req, res) => {
    const { name, species, race } = req.body;

    try {
        // Buscar el objeto en HubSpot
        const searchPayload = {
            filterGroups: [{
                filters: [{
                    propertyName: "name",
                    operator: "EQ",
                    value: name
                }]
            }],
            properties: ["name", "species", "race"]
        };

        const searchResponse = await axios.post(
            `${HUBSPOT_API_URL}/crm/v3/objects/${CUSTOM_OBJECT_NAME}/search`,
            searchPayload,
            {
                headers: {
                    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const results = searchResponse.data.results;

        if (results.length > 0) {
            // Si existe, actualizar el objeto
            const existingObjectId = results[0].id;

            const updatePayload = {
                properties: {
                    "name": name,
                    "species": species,
                    "race": race
                }
            };

            await axios.patch(
                `${HUBSPOT_API_URL}/crm/v3/objects/${CUSTOM_OBJECT_NAME}/${existingObjectId}`,
                updatePayload,
                {
                    headers: {
                        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`Mascota con ID ${existingObjectId} actualizada.`);
        } else {
            // Si no existe, crear un nuevo objeto
            const createPayload = {
                properties: {
                    "name": name,
                    "species": species,
                    "race": race
                }
            };

            await axios.post(
                `${HUBSPOT_API_URL}/crm/v3/objects/${CUSTOM_OBJECT_NAME}`,
                createPayload,
                {
                    headers: {
                        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`Nueva mascota creada.`);
        }

        res.redirect('/');

    } catch (error) {
        console.error('Error en el proceso:', error.response?.data || error.message);
        res.status(500).send('Error al actualizar o crear el objeto en HubSpot');
    }
});

// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));