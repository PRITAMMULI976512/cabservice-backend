const mongoose = require('mongoose');
const DBconnect = async () => {
    let url = "mongodb+srv://pritammuli:pritammuli@cluster0.mk33tmb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    try {
        const conn = await mongoose.connect(url);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = DBconnect