/*
  ClubDescrScreen.js
  Displays the details of clubs by pulling them from FireStore
*/
import React from 'react';
import {
  View,
  Button,
  FlatList,
  YellowBox,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';

import { ActivityIndicator } from 'react-native-paper'
import { ScrollView } from 'react-navigation';
import { Appbar, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/AntDesign';

import * as firebase from 'firebase';
import fb from '../redux/fb';
import 'firebase/firestore';
import { compose } from 'redux'
import { connect } from 'react-redux'
import { firestoreConnect, isLoaded } from 'react-redux-firebase'
import { store } from '../redux/store'
import { styles } from './Styles.js' //Styling for components



class ClubDescrScreen extends React.Component {
  //Normal constructor, setting default state, binding functions for later use, ignoring warnings that don't matter
  constructor(props) {
    super(props);
    YellowBox.ignoreWarnings(['Setting a timer']);
    console.ignoredYellowBox = [
      'Setting a timer'
    ];
    this.changeClubStatus = this.changeClubStatus.bind(this);
    this.state = {
      membershipSwitched: false
    }
  }
  //Reset membershipSwitched when it changes, this prevents issues with accessing multiple ClubDescrScreens
  componentDidUpdate() {
    if (this.props.clubQuery[0].members.includes(this.props.auth.uid) && this.state.membershipSwitched) {
      this.setState({ membershipSwitched: false })
    }
  }
  //Separator component, just for styling
  Separator() {
    return <View style={styles.separator} />;
  }
  //Logic for changing a member's club join status 
  changeClubStatus() {
    //Initializing cloud functions for each possibility
    var joinClub = fb.functions().httpsCallable('joinClub');
    var leaveClub = fb.functions().httpsCallable('leaveClub');
    //Get all club members
    let members = this.props.clubQuery[0].members;
    console.log("Members:", members)
    //If they are a member of the club, set membershipSwitched to true and call leaveClub
    if (members.includes(this.props.auth.uid)) {
      leaveClub({ club: this.props.id }).catch((error) => console.log(error));
      this.setState({ membershipSwitched: true })
    }
    //Else, join the club
    else {
      joinClub({ club: this.props.id }).catch((error) => console.log(error));
      this.setState({ membershipSwitched: true })
    }
  }
  //Render the bitty
  render() {
    var haveClub = true; //for testing add/plus
    //If the club info is loading, display loading text. Else, display data
    if (!isLoaded(this.props.clubQuery)) {
      return (
        <View><ActivityIndicator animating={true} /></View>
      );
    }
    //If the previous screen's clubId isn't the same as this instance, then wait until the correct club is loaded
    else if (this.props.clubQuery[0].id != this.props.navigation.getParam('id')) {
      return (
        <View><ActivityIndicator animating={true} /></View>
      );
    }
    else {
      let club = this.props.clubQuery[0];
      //Render out the club details into a readable format
      return (
        <View>
          <Appbar.Header>
            <Appbar.Action icon="left" onPress={() => this.props.navigation.navigate("ClubDirectory")} />
            <Appbar.Content
              title={
                (club.clubName.length > 20)
                  ? club.abbrevName
                  : club.clubName}
            //title={this.props.club.clubName}
            />
            <Appbar.Action icon={club.members.includes(this.props.auth.uid) || this.state.membershipSwitched ? "minus" : "plus"} onPress={() => this.changeClubStatus()} />
          </Appbar.Header>
          <Text style={styles.clubText}>Rm. {club.roomNumber}</Text>
          <Text style={styles.clubText}>We meet at {club.when} every {club.day}</Text>
          <Text style={styles.clubText}>{club.shortDesc}</Text>
        </View>
      )
    }
  }
}

//Map the needed redux state variables to local ones
function mapStateToProps(state) {
  return {
    clubQuery: state.firestore.ordered.descrClub,
    id: state.clubs.descrId,
    auth: state.firebase.auth
  }
}

//Export an HOC connected to the correct club in Firestore, store it in its own descrClub variable for logic purposes
export default compose(
  firestoreConnect((props) => [{ collection: 'clubs', doc: props.navigation.getParam('id'), storeAs: 'descrClub' }]),
  connect(mapStateToProps)
)(ClubDescrScreen);

