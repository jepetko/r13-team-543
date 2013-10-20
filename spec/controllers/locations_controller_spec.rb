require 'spec_helper'

describe LocationsController do

  render_views

  describe 'routing' do
    it 'routes to #find' do
      { :get => '/locations/find'}.should \
          route_to(:controller => 'locations', :action => 'find')
    end
  end

  describe 'find' do
    it 'should return valid results for the input' do
      get :find, str: 'New York', format: 'json'
      response.should be_success
      b = response.body
      b.should =~ /^\[(.*)\]$/
    end
  end
end