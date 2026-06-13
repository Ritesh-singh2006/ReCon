import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/User.js";

// PART 1 — Configure Google Strategy
// This tells passport how to handle Google login
passport.use(
    new GoogleStrategy(
        {
            // These tell Google which app is making the request
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,

            // This must exactly match what you put in Google Console
            callbackURL: "http://localhost:3000/auth/google/callback",
        },

        // This function runs after Google confirms the user's identity
        // profile = everything Google tells us about the user
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if this Google user already exists in our DB
                let user = await UserModel.findOne({
                    googleId: profile.id,
                });

                if (user) {
                    // User exists — just return them
                    // done(error, user) — null means no error
                    return done(null, user);
                }

                // User doesn't exist — create them for the first time
                const newUser = await UserModel.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                });

                return done(null, newUser);
            } catch (err) {
                // Something went wrong — pass error to passport
                return done(err, null);
            }
        }
    )
);

// PART 2 — serializeUser
// Runs once after login — decides what to store in the session cookie
// We store just the MongoDB _id (small, unique, enough to identify user)
passport.serializeUser((user, done) => {
    done(null, user._id);
    // After this, session cookie contains just this _id
});

// PART 3 — deserializeUser
// Runs on EVERY request that has a session cookie
// Takes the stored _id, fetches full user from MongoDB
// Attaches result to req.user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
        // After this, req.user = full user object in every route
    } catch (err) {
        done(err, null);
    }
});

export default passport;