use strict;
use warnings;
package RF::Decoder::Base;

sub new {
  my $pkg = shift;
  bless { @_ }, $pkg;
}

sub is_state {
  $_[0]->{_state} == $_[1];
}

sub set_state {
  $_[0]->{_state} = $_[1];
}

sub process_bits {
  my ($self, $bits, $cb) = @_;
  $cb->($bits);
}

1;
