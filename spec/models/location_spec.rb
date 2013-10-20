require 'spec_helper'

describe Location do

  it 'should respond to str' do
    Location.new.should respond_to(:str)
  end

  it 'should not be persisted' do
    Location.new.persisted?.should be_false
  end

end