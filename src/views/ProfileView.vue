<template>
  <div class="profile-view">
    <div class="background-container" :style="{ backgroundImage: `url(${bgImage})` }">
      <div class="overlay-text">
        <h1 style="font-weight: 900">Hello {{ profileData.name }}!</h1>
        <p>This is your profile page. You can edit your details here!</p>
      </div>
    </div>

    <br /><br />

    <div class="profile-details">
      <div class="column">
        <label>Name:</label>
        <div class="fixed-data">
          <p><strong>{{ profileData.name }}</strong></p>
        </div>
        <br />

        <label>Email:</label>
        <div class="fixed-data">
          <p><strong>{{ profileData.email }}</strong></p>
        </div>
        <br />

        <label>Career Stage:</label>
        <div class="fixed-data">
          <p><strong>{{ profileData.careerStage || 'Not specified' }}</strong></p>
        </div>
        <br />

        <label>Skills:</label>
        <div class="fixed-data">
          <p><strong>{{ profileData.skills.length ? profileData.skills.join(', ') : 'Not specified' }}</strong></p>
        </div>
        <br />

        <label>Goals:</label>
        <div class="fixed-data">
          <p><strong>{{ profileData.goals.length ? profileData.goals.join(', ') : 'Not specified' }}</strong></p>
        </div>
        <br />

        <label>Available Time:</label>
        <div class="fixed-data">
          <p><strong>{{ profileData.availableTime || 'Not specified' }}</strong></p>
        </div>
      </div>

      <div class="column">
        <div class="profile-container">
          <img :src="profileData.profileURL || defaultProfilePicture" alt="Profile Picture" />
          <button id="edit-btn" @click="dialog = true">Edit</button>
        </div>
      </div>
    </div>

    <button id="logout-btn" @click="logout">Log out</button>

    <!-- Upload Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>Upload New Profile Picture</v-card-title>
        <v-card-text>
          <v-file-input
            label="Choose Image"
            accept="image/*"
            show-size
            @change="onFileSelected"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="saveImage">Save</v-btn>
          <v-btn color="grey" @click="dialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import backgroundImage from "@/assets/profile_background.png";
import defaultProfilePicture from "@/assets/default_profile.png"
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { firestore, storage } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default {
  name: "ProfileView",
  data() {
    return {
      bgImage: backgroundImage,
      defaultProfilePicture,
      dialog: false,
      selectedFile: null,
      profileData: {
        name: "",
        email: "",
        profileURL: "",
        careerStage: "",
        skills: [],
        goals: [],
        availableTime: "",
      },
    };
  },
  created() {
    this.fetchProfileData();
  },
  methods: {
    async fetchProfileData() {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const usersRef = collection(firestore, "users");
        const usersQuery = query(usersRef, where("userID", "==", currentUser.uid));

        onSnapshot(usersQuery, (snapshot) => {
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();

            this.profileData = {
              name: userData.name || "",
              email: userData.email || "",
              profileURL: userData.profileURL || this.defaultProfilePicture,
              careerStage: userData.careerStage || "",
              skills: userData.skills || [],
              goals: userData.goals || [],
              availableTime: userData.availableTime || "",
            };
          }
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    },

    logout() {
      signOut(auth)
        .then(() => this.$router.push("/signin"))
        .catch((error) => console.error(error));
    },

    onFileSelected(event) {
      this.selectedFile = event.target.files[0];
    },

    // doesnt work as of now as need pay firebase to store images
    async saveImage() {
      if (!this.selectedFile) {
        alert("Please select a file first.");
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const pfpRef = ref(storage, `profilePictures/${currentUser.uid}`);

      try {
        await uploadBytes(pfpRef, this.selectedFile);
        const downloadURL = await getDownloadURL(pfpRef);

        const userRef = doc(firestore, "users", currentUser.uid);
        await updateDoc(userRef, { profileURL: downloadURL });

        this.profileData.profileURL = downloadURL;
        this.dialog = false;
        alert("Profile picture updated successfully.");
      } catch (error) {
        alert("Error uploading image: " + error.message);
      }
    },
  },
};
</script>

<style scoped>
.background-container {
  position: relative;
  width: 100%;
  height: 300px;
  background-size: cover;
  background-position: center;
}

.overlay-text {
  position: absolute;
  top: 10%;
  left: 5%;
  color: black;
  z-index: 2;
  text-align: left;
}

.fixed-data {
  background-color: #f3f3f3;
  padding: 8px;
  border-radius: 10px;
  width: 300px;
}

#edit-btn {
  background-color: black;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 10px;
  margin: 20px auto;
  display: block;
  cursor: pointer;
}

#edit-btn:hover {
  background-color: #272d4e;
}

#logout-btn {
  background-color: black;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 10px;
  margin: 20px auto;
  display: block;
  cursor: pointer;
}

#logout-btn:hover {
  background-color: #272d4e;
}

.profile-details {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 20px auto;
  width: 80%;
  gap: 20px;
}

.column {
  width: 45%;
  display: flex;
  flex-direction: column;
}

.profile-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-container img {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 50%;
}

.profile-details label {
  text-align: left;
  margin-bottom: 5px;
  display: block;
}

.profile-details .fixed-data {
  margin-bottom: 15px;
}
</style>